import "server-only"

import { revalidateTag as nextRevalidateTag } from "next/cache"

import { getCacheOptions } from "./cookies"

/** Next 16 requires a cacheLife profile. "max" keeps stale-while-revalidate. */
export function revalidateTag(tag: string) {
  nextRevalidateTag(tag, "max")
}

/** Store catalog — always refetch so Medusa admin edits show on browser refresh. */
export function catalogFetchOptions(): { cache: "no-store" } {
  return { cache: "no-store" }
}

/** Session-scoped data (cart, customer, orders) — keep tagged Data Cache. */
export async function taggedFetchOptions(tag: string) {
  return {
    ...(await getCacheOptions(tag)),
    cache: "force-cache" as const,
  }
}
