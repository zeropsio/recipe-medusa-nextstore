/**
 * Node-only: a running process keeps boot-time env. After medusa seed
 * writes CHANNEL_PUBLISHABLE_KEY, exit so the supervisor starts a new
 * next-server (or sooner via /api/internal/reload-env).
 */
const keyValues = [
  process.env.MEDUSA_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  process.env.RUNTIME_NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
]

const hasUnresolvedRef = keyValues.some(
  (value) => Boolean(value) && value.includes("${")
)

const resolved = keyValues.some(
  (value) => Boolean(value) && value.startsWith("pk_") && !value.includes("${")
)

if (process.env.ZEROPS_ProjectId && !resolved) {
  const delayMs = hasUnresolvedRef
    ? 0
    : Number(process.env.PUBLISHABLE_KEY_RESPAWN_MS || 15_000)
  console.warn(
    `instrumentation: publishable key is not a pk_ value; exiting in ${Math.round(delayMs / 1000)}s so Zerops respawns with the current env store.`
  )
  setTimeout(() => {
    process.exit(0)
  }, delayMs)
}
