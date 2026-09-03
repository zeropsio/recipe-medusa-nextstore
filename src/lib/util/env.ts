export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}

function readEnv(name: string): string {
  // Bracket access so Next/Turbopack cannot inline an empty build-time value.
  return process.env[name]?.trim() || ""
}

/** Private hostname on the server; public API URL in the browser. */
export function getMedusaBackendUrl(): string {
  return (
    readEnv("MEDUSA_BACKEND_URL") ||
    readEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL") ||
    "http://localhost:9000"
  )
}

/**
 * Publishable key for Medusa store APIs.
 * NEXT_PUBLIC_* is baked at build; MEDUSA_PUBLISHABLE_KEY is the runtime fallback
 * when the first storefront build ran before backend seed wrote CHANNEL_PUBLISHABLE_KEY.
 */
export function getMedusaPublishableKey(): string {
  return (
    readEnv("MEDUSA_PUBLISHABLE_KEY") ||
    readEnv("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY") ||
    readEnv("RUNTIME_NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  )
}
