import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Exit so Zerops respawns next start with the current env store (publishable
 * key after medusa seed). Called from medusa `yarn reloadNextstoreEnv`.
 * Secret is nextstore's service envSecret REVALIDATE_SECRET (not yaml-baked).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  const provided = request.headers.get("x-reload-secret")

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  setTimeout(() => {
    process.exit(0)
  }, 250)

  return NextResponse.json({ status: "reloading" })
}
