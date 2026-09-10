import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Exit so Zerops respawns next start with the current env store (publishable
 * key after medusa seed). Called from medusa `yarn reloadNextstoreEnv`.
 * Secret is project envSecret RELOAD_SECRET (inherited on Zerops); local dev
 * may use REVALIDATE_SECRET in .env instead.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RELOAD_SECRET || process.env.REVALIDATE_SECRET
  const provided = request.headers.get("x-reload-secret")

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  setTimeout(() => {
    process.exit(0)
  }, 250)

  return NextResponse.json({ status: "reloading" })
}
