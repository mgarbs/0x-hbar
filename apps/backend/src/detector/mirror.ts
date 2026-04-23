import { log } from "../logger.js";

export interface MirrorTransfer {
  account: string;
  amount: number;
  is_approval?: boolean;
}

export interface MirrorTx {
  consensus_timestamp: string;
  transaction_id: string;
  name: string;
  result: string;
  memo_base64?: string | null;
  transfers: MirrorTransfer[];
  payer_account_id?: string;
  charged_tx_fee?: number;
}

export interface MirrorPage {
  transactions: MirrorTx[];
  links: { next: string | null };
}

export interface MirrorClient {
  fetchInbound(
    accountId: string,
    afterTimestamp: string,
    limit?: number
  ): Promise<MirrorTx[]>;
  accountExists(accountAliasOrId: string): Promise<boolean>;
}

export function buildMirrorClient(baseUrl: string): MirrorClient {
  async function fetchJson<T>(path: string): Promise<T | null> {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`mirror ${res.status} ${res.statusText} ${url} :: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  return {
    async fetchInbound(accountId, afterTimestamp, limit = 100) {
      const all: MirrorTx[] = [];
      let path =
        `/api/v1/transactions` +
        `?account.id=${encodeURIComponent(accountId)}` +
        `&order=asc` +
        `&limit=${limit}` +
        (afterTimestamp && afterTimestamp !== "0.0"
          ? `&timestamp=gt:${afterTimestamp}`
          : "");
      while (path) {
        const page = await fetchJson<MirrorPage>(path);
        if (!page) break;
        all.push(...page.transactions);
        if (!page.links?.next || all.length >= 500) break;
        path = page.links.next;
      }
      log.trace({ accountId, afterTimestamp, count: all.length }, "mirror.fetchInbound");
      return all;
    },

    async accountExists(accountAliasOrId) {
      const path = `/api/v1/accounts/${encodeURIComponent(accountAliasOrId)}`;
      try {
        const res = await fetchJson<{ account: string }>(path);
        return res !== null;
      } catch (err) {
        log.warn({ err, accountAliasOrId }, "mirror.accountExists failed; assuming hollow");
        return false;
      }
    },
  };
}
