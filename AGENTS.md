<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guidelines

## Toolchain and Validation

- Use Node.js 24.x and pnpm 11.20.0, matching `package.json`. Prefer `corepack pnpm ...` when the globally installed pnpm differs.
- Install dependencies with `pnpm install --frozen-lockfile`. Keep the pnpm version in `.github/workflows/` synchronized with `package.json`; pin GitHub Actions to full commit SHAs.
- Run `pnpm lint` for the repository-wide Prettier check, `pnpm test -- --run` for CI-style unit tests, and `pnpm test:e2e` for Playwright tests. `pnpm build` also runs `scripts/pre-build.js` and Prisma generation.
- Environment variables and data-source setup are documented in [README.md](README.md) and [README_ja.md](README_ja.md). Do not expose `.env.local` values in code, logs, or test output.
- When a check exposes unrelated pre-existing failures, report them separately and keep the change scoped to the requested behavior.

## Architecture

- This is a Next.js App Router application. Pages, layouts, and client components live under `src/app`; HTTP Route Handlers live under `src/app/api`; shared client data access is commonly implemented as hooks under `src/app/hook`.
- Google Sheets-backed data is read by server-side API routes and consumed by client hooks. Preserve that boundary instead of calling external data sources directly from client components; `src/app/hook/useSongs.tsx` and `src/app/api/songs/route.tsx` are representative examples.
- Locales are `ja` (default) and `en`, with locale prefixes used only when needed. Use the helpers from `src/i18n/navigation.ts` for localized `Link`, router, and pathname operations rather than importing these APIs from `next/navigation`.
- `src/proxy.ts` rewrites locale-prefixed paths and passes the locale through `x-locale`; changes to routing should be checked together with `src/i18n/routing.ts` and `src/i18n/request.ts`.
- Prisma schema and migrations live under `prisma/`. Treat `src/generated/prisma/` as generated output and do not edit it directly; update the schema or migrations and regenerate instead.

## Next.js and Generated Files

- Before changing Next.js APIs or configuration, read the relevant guide under `node_modules/next/dist/docs/` as required by the generated instructions above.
- Preserve the `next dev` generated block at the top of this file. It may be regenerated automatically and should not be removed or rewritten.
