# Zerops x Medusa Next.js storefront

<!-- #ZEROPS_EXTRACT_START:intro# -->
Official Medusa v2.19 Next.js App Router storefront for the [recipe-medusa](https://github.com/zeropsio/recipe-medusa) backend. Runs as Node SSR on Zerops (port 8000) and talks to Medusa with `NEXT_PUBLIC_MEDUSA_BACKEND_URL` plus a publishable API key.
<!-- #ZEROPS_EXTRACT_END:intro# -->

## Local development

```bash
cp .env.template .env.local
yarn
yarn dev
```

Set `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to a running Medusa v2.19 backend and `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` to a publishable key from Admin → Settings → API Key Management.

Storefront: `http://localhost:8000`

<!-- #ZEROPS_EXTRACT_START:integration-guide# -->
## Integration Guide

### 1. Adding `zerops.yml`

Place [`zerops.yml`](zerops.yml) at the repository root. Setup name `nextstore` must match `zeropsSetup` in the import yaml.

- Build: `nodejs@22`, `corepack enable`, then Yarn Berry 3.2.3 (`packageManager`). `NEXT_PUBLIC_*` is baked in at build time — set the same keys on `build.envVariables` and `run.envVariables`.
- Run: port `8000`, start `./node_modules/.bin/next start -p 8000` (do not rely on Yarn 3 being on the runtime PATH). Readiness check is `/`.
- Map `API_URL` → `NEXT_PUBLIC_MEDUSA_BACKEND_URL` / `MEDUSA_BACKEND_URL` and `APP_URL` → `NEXT_PUBLIC_BASE_URL`. The publishable key comes from `medusa_CHANNEL_PUBLISHABLE_KEY` after backend seed. Map `STRIPE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_STRIPE_KEY` for Stripe (set `STRIPE_API_KEY` on the backend too).

This service is Node SSR — do not switch it to `type: static` or `output: 'export'`.

### 2. Key configuration points

- `check-env-variables.js` exits the build if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is missing.
- First storefront build needs the backend init to have written `CHANNEL_PUBLISHABLE_KEY` (or a previous `RUNTIME_NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`).
- Do not cache `.next` in `zerops.yml` — Zerops cache restore can cause EACCES on later builds.
<!-- #ZEROPS_EXTRACT_END:integration-guide# -->
