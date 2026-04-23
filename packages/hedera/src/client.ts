import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import type { HederaNetwork } from "./constants.js";

export interface HederaCtx {
  client: Client;
  operatorId: AccountId;
  operatorKey: PrivateKey;
  treasuryId: AccountId;
  network: HederaNetwork;
}

export function buildClient(opts: {
  network: HederaNetwork;
  operatorId: string;
  operatorKey: string;
  treasuryId: string;
}): HederaCtx {
  const client = (() => {
    switch (opts.network) {
      case "testnet":
        return Client.forTestnet();
      case "mainnet":
        return Client.forMainnet();
      case "previewnet":
        return Client.forPreviewnet();
    }
  })();

  const operatorId = AccountId.fromString(opts.operatorId);
  const operatorKey = parseKey(opts.operatorKey);
  const treasuryId = AccountId.fromString(opts.treasuryId);

  client.setOperator(operatorId, operatorKey);

  return { client, operatorId, operatorKey, treasuryId, network: opts.network };
}

function parseKey(raw: string): PrivateKey {
  const trimmed = raw.trim();
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    return PrivateKey.fromStringECDSA(hex);
  }
  return PrivateKey.fromString(trimmed);
}
