import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import {
  getMedusaBackendUrl,
  getMedusaPublishableKey,
} from "./lib/util/env"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "de"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache
  const backendUrl = getMedusaBackendUrl()
  const publishableKey = getMedusaPublishableKey()

  if (!backendUrl) {
    console.error(
      "proxy.ts: MEDUSA_BACKEND_URL / NEXT_PUBLIC_MEDUSA_BACKEND_URL is unset."
    )
    return regionMap
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 60 * 1000
  ) {
    try {
      if (!publishableKey) {
        console.error(
          "proxy.ts: publishable key is unset (MEDUSA_PUBLISHABLE_KEY / NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)."
        )
        return regionMap
      }

      // Fetch regions from Medusa. Keep this as fetch so proxy startup does not
      // depend on the JS SDK being initialized in the Node request path.
      const response = await fetch(`${backendUrl}/store/regions`, {
        method: "GET",
        headers: { "x-publishable-api-key": publishableKey },
        cache: "no-store",
      })

      if (!response.ok) {
        console.error(
          `proxy.ts: /store/regions returned ${response.status} from ${backendUrl}`
        )
        return regionMap
      }

      const json = await response.json()

      const { regions } = json

      if (!regions?.length) {
        return new Map<string, HttpTypes.StoreRegion>()
      }

      // Create a map of country codes to regions.
      regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          regionMapCache.regionMap.set(c.iso_2 ?? "", region)
        })
      })

      regionMapCache.regionMapUpdated = Date.now()
    } catch (error) {
      console.error(
        "proxy.ts: failed to fetch regions; continuing with default country.",
        error
      )
    }
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  let countryCode

  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  // Cloudflare Workers provides country via request.cf.country
  const cloudflareCountryCode = (request as { cf?: { country?: string } }).cf?.country?.toLowerCase()

  // Vercel provides x-vercel-ip-country header
  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    countryCode = urlCountryCode
  } else if (cloudflareCountryCode && regionMap.has(cloudflareCountryCode)) {
    countryCode = cloudflareCountryCode
  } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    countryCode = vercelCountryCode
  } else if (regionMap.has(DEFAULT_REGION)) {
    countryCode = DEFAULT_REGION
  } else if (regionMap.keys().next().value) {
    countryCode = regionMap.keys().next().value
  }

  return countryCode
}

/**
 * Proxy to handle region selection and onboarding status.
 */
export async function proxy(request: NextRequest) {
  try {
    if (request.nextUrl.pathname.includes(".")) {
      return NextResponse.next()
    }

    const cacheIdCookie = request.cookies.get("_medusa_cache_id")
    const cacheId = cacheIdCookie?.value || crypto.randomUUID()

    let regionMap: Map<string, HttpTypes.StoreRegion>
    try {
      regionMap = await getRegionMap(cacheId)
    } catch (error) {
      console.error(
        "proxy.ts: region lookup failed; using default country.",
        error
      )
      regionMap = new Map()
    }
    const countryCode = await getCountryCode(request, regionMap)

    // if the country code is available, use it, otherwise use the default region
    const country = countryCode || DEFAULT_REGION
    const firstPathSegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
    const urlHasCountry = firstPathSegment === country.toLowerCase()

    if (urlHasCountry) {
      if (!cacheIdCookie) {
        const response = NextResponse.next()
        response.cookies.set("_medusa_cache_id", cacheId, {
          maxAge: 60 * 60 * 24,
        })
        return response
      }
      return NextResponse.next()
    }

    // if the url doesn't have the country, redirect to it
    const redirectPath =
      request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
    const queryString = request.nextUrl.search || ""
    const redirectUrl = `${request.nextUrl.origin}/${country}${redirectPath}${queryString}`

    return NextResponse.redirect(redirectUrl, 307)
  } catch (error) {
    console.error("proxy.ts: unexpected failure; passing request through.", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
