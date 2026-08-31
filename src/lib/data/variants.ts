"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

import { catalogFetchOptions } from "./cache"
import { getAuthHeaders } from "./cookies"

export const retrieveVariant = async (
  variant_id: string
): Promise<HttpTypes.StoreProductVariant | null> => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  return await sdk.client
    .fetch<{ variant: HttpTypes.StoreProductVariant }>(
      `/store/product-variants/${variant_id}`,
      {
        method: "GET",
        query: {
          fields: "*images",
        },
        headers,
        ...catalogFetchOptions(),
      }
    )
    .then(({ variant }) => variant)
    .catch(() => null)
}
