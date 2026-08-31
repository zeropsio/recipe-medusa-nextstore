"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { catalogFetchOptions } from "./cache"

export const listRegions = async () => {
  return await sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      ...catalogFetchOptions(),
    })
    .then(({ regions }) => regions)
}

export const retrieveRegion = async (id: string) => {
  return await sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      ...catalogFetchOptions(),
    })
    .then(({ region }) => region)
}

export const getRegion = async (countryCode: string) => {
  const regions = await listRegions()

  if (!regions) {
    return null
  }

  const regionMap = new Map<string, HttpTypes.StoreRegion>()

  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
  })

  return countryCode ? regionMap.get(countryCode) : regionMap.get("us")
}
