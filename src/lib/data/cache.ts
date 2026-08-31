import "server-only"

import { getCacheOptions } from "./cookies"

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
