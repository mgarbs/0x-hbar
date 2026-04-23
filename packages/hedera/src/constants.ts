export const TINYBARS_PER_HBAR = 100_000_000n;

export const MIRROR_BASE = {
  testnet: "https://testnet.mirrornode.hedera.com",
  mainnet: "https://mainnet-public.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
} as const;

export type HederaNetwork = keyof typeof MIRROR_BASE;

export function hbarToTinybars(hbar: number): bigint {
  return BigInt(Math.round(hbar * Number(TINYBARS_PER_HBAR)));
}

export function tinybarsToHbar(tb: bigint | number | string): number {
  const n = typeof tb === "bigint" ? tb : BigInt(tb);
  return Number(n) / Number(TINYBARS_PER_HBAR);
}

export function formatHbar(tb: bigint | number | string, digits = 8): string {
  return tinybarsToHbar(tb).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}
