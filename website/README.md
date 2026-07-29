# Fleetum Marketing Website

Public marketing website for Fleetum, built with Next.js and exported as static
HTML. It shares the production Caddy container with the existing tenant
application but is served from a separate document root.

## Local development

From the repository root:

```bash
npm ci
npm run dev:website
```

The website is available at `http://127.0.0.1:4174`.

## Verification

```bash
npm run verify:website
```

The production export is generated in `website/out`. The test suite checks that
the required public pages, canonical metadata, structured data, `robots.txt`,
`sitemap.xml`, pricing and static assets are present.

## Pricing

Public prices are imported from `packages/commercial-plan-catalog`. Never copy
plan amounts or the annual discount into website components: update the shared
catalog first, then verify the corresponding Stripe Price IDs.

## Environment variables

Copy `website/.env.example` to `website/.env.local` for local overrides.

- `NEXT_PUBLIC_API_URL`: Fleetum public API base URL.
- `NEXT_PUBLIC_SITE_URL`: canonical marketing website origin.
- `NEXT_PUBLIC_APP_LOGIN_URL`: existing tenant application login URL.
- `NEXT_PUBLIC_SITE_INDEXABLE`: set to `true` only in production.

No secret belongs in this workspace. Every variable is embedded in public static
assets and must therefore contain only non-sensitive values.

## Production routing

The production image contains two independent roots:

- `/srv/fleetum-website`: this static marketing website;
- `/srv/fleetum`: the existing React/Vite tenant and Platform applications.

`deploy/caddy/Caddyfile` sends only the explicit public route allowlist to the
marketing root. Application routes such as `/login`, `/dashboard`, and
`/booking` continue to use the existing SPA and receive `noindex` headers.
`platform.fleetum.it` is also excluded from search indexing.

Search Console activation is documented in
`docs/seo/search-console-setup.md`. Public legal drafts remain out of the
sitemap until the professional review gate is complete.
