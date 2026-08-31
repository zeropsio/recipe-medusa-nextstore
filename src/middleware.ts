import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

// Prefer the private service URL on the server. NEXT_PUBLIC_ is the browser origin.
const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "de"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    console.error(
      "Middleware.ts: MEDUSA_BACKEND_URL / NEXT_PUBLIC_MEDUSA_BACKEND_URL is unset."
    )
    return regionMap
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 60 * 1000
  ) {
    try {
      // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        method: "GET",
        headers: PUBLISHABLE_API_KEY
          ? { "x-publishable-api-key": PUBLISHABLE_API_KEY }
          : undefined,
        cache: "no-store",
      })

      if (!response.ok) {
        console.error(
          `Middleware.ts: /store/regions returned ${response.status} from ${BACKEND_URL}`
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
        "Middleware.ts: failed to fetch regions; continuing with default country.",
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
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
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
        "Middleware.ts: region lookup failed; using default country.",
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
    console.error("Middleware.ts: unexpected failure; passing request through.", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
