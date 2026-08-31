"use server"

import { sdk } from "@lib/config"
import { catalogFetchOptions } from "./cache"

export type Locale = {
  code: string
  name: string
}

/**
 * Fetches available locales from the backend.
 * Returns null if the endpoint returns 404 (locales not configured).
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  return sdk.client
    .fetch<{ locales: Locale[] }>(`/store/locales`, {
      method: "GET",
      ...catalogFetchOptions(),
    })
    .then(({ locales }) => locales)
    .catch(() => null)
}
