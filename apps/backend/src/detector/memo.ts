import { EVM_ADDRESS_RE } from "@0xhbar/types";

export function decodeMemo(memoBase64: string | null | undefined): string | null {
  if (!memoBase64) return null;
  try {
    const buf = Buffer.from(memoBase64, "base64");
    return buf.toString("utf8").replace(/\0+$/, "").trim();
  } catch {
    return null;
  }
}

export function extractEvmAddress(memo: string | null): string | null {
  if (!memo) return null;
  const trimmed = memo.trim();
  if (EVM_ADDRESS_RE.test(trimmed)) return trimmed.toLowerCase();
  // tolerate whitespace and prefixes like "forward 0x.."
  const match = trimmed.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0].toLowerCase() : null;
}
