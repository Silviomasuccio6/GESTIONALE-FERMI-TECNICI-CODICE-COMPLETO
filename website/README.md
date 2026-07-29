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
the required public pages, metadata, `robots.txt`, `sitemap.xml`, and static
assets are present.

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
`/booking` continue to use the existing SPA.
