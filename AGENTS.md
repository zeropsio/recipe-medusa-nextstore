# recipe-medusa-nextstore

Official Medusa v2.19 Next.js 16 App Router storefront (from [dtc-starter](https://github.com/medusajs/dtc-starter) `apps/storefront`) on Zerops Node SSR. Yarn **3.2.3**. Talks to [recipe-medusa](https://github.com/zeropsio/recipe-medusa).

## Zerops service facts

- Hostname / `zeropsSetup`: `nextstore`
- HTTP port: `8000`
- Siblings:
  - `medusa` — API + admin on 9000 — `API_URL` → `NEXT_PUBLIC_MEDUSA_BACKEND_URL` / `MEDUSA_BACKEND_URL`; `medusa_CHANNEL_PUBLISHABLE_KEY` → `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
  - `search` — Meilisearch — `NEXT_PUBLIC_SEARCH_*` (optional; DTC starter has no InstantSearch UI)
  - `storage` — MinIO — `OBJECT_STORAGE_API_URL` (Next image `remotePatterns`)
- Runtime base: `nodejs@22` (SSR — not `static`)

Pipeline: [`zerops.yml`](zerops.yml).

## Zerops dev

This recipe ships `setup: nextstore` only (no idle `setup: dev`). Local and agent work:

- Dev command: `yarn dev` (`next dev -p 8000`; Turbopack is the Next.js 16 default)
- In-container / local rebuild: `yarn build`
- Prod start: `yarn start` (Zerops: `./node_modules/.bin/next start -p 8000`)

Copy [`.env.template`](.env.template) to `.env.local` for local. `check-env-variables.js` **exits the build** if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is missing.

**All platform operations (start/stop/status/logs, deploy, env / scaling / storage / domains) go through the Zerops development workflow via `zcp` MCP tools. Don't shell out to `zcli`.**

## Notes

- `NEXT_PUBLIC_*` is baked in at **build** time. Map `APP_URL` / `API_URL` (not the recipe aliases) on both `build.envVariables` and `run.envVariables`. Map `STRIPE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_STRIPE_KEY` for Stripe checkout (backend must also have `STRIPE_API_KEY`). Enable Corepack before `yarn` so the image’s Yarn 1 does not install this Berry lockfile. First storefront build needs the backend seed to have written `CHANNEL_PUBLISHABLE_KEY` (or a previous `RUNTIME_NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`).
- SDK: [`src/lib/config.ts`](src/lib/config.ts) accepts `NEXT_PUBLIC_MEDUSA_BACKEND_URL` or `MEDUSA_BACKEND_URL`. Region proxy ([`src/proxy.ts`](src/proxy.ts)) needs a reachable Medusa + publishable key at runtime. Read the key via [`getMedusaPublishableKey()`](src/lib/util/env.ts) (`MEDUSA_PUBLISHABLE_KEY` first) so Next 16 cannot inline an empty build-time `NEXT_PUBLIC_*` into store requests.
- Pin `@medusajs/js-sdk` and `@medusajs/types` to **2.19.0** (never `latest`). App Router lives under `src/app/[countryCode]/`; data in `src/lib/data/`; UI in `src/modules/`.
- `generateStaticParams` on product/category/collection pages returns `[]` if Medusa is down so `yarn build` works without a live backend.
- Do not switch this service to `type: static` / `output: 'export'`. Do not reintroduce the deprecated standalone `nextjs-starter-medusa` template. Do not put `NEXT_PUBLIC_*` on import.yaml **service** `envVariables`. Do not commit `.env.local` or `.next/`.
