import type { MirrorClient } from "../detector/mirror.js";

interface CacheEntry {
  exists: boolean;
  checkedAt: number;
}

export function buildHollowResolver(mirror: MirrorClient, ttlMs = 30_000) {
  const cache = new Map<string, CacheEntry>();

  return {
    async destinationIsHollow(evmAddress: string): Promise<boolean> {
      const lowered = evmAddress.toLowerCase();
      const now = Date.now();
      const cached = cache.get(lowered);
      if (cached && now - cached.checkedAt < ttlMs) {
        return !cached.exists;
      }
      const exists = await mirror.accountExists(lowered);
      cache.set(lowered, { exists, checkedAt: now });
      return !exists;
    },
    noteCreated(evmAddress: string): void {
      cache.set(evmAddress.toLowerCase(), { exists: true, checkedAt: Date.now() });
    },
  };
}

export type HollowResolver = ReturnType<typeof buildHollowResolver>;
