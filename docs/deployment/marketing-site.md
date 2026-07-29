# Marketing website deployment

## Architecture

Fleetum uses one production Caddy container with two independent static roots:

- `/srv/fleetum-website` for the Next.js static marketing export;
- `/srv/fleetum` for the existing React/Vite tenant and Platform applications.

The frontend production image builds both workspaces. Caddy maps an explicit
allowlist of public marketing routes to the new export and keeps every other
route on the existing SPA. API and Platform reverse proxies are unchanged.

## Production configuration

The deploy workflow provides these public build arguments:

```text
NEXT_PUBLIC_API_URL=https://api.fleetum.it/api
NEXT_PUBLIC_SITE_URL=https://fleetum.it
NEXT_PUBLIC_APP_LOGIN_URL=https://fleetum.it/login
NEXT_PUBLIC_SITE_INDEXABLE=true
```

These values are public by design. Never pass secrets through `NEXT_PUBLIC_*`
variables.

## Release verification

Before merge:

```bash
npm run verify:website
npm run verify:release
docker build -f frontend/Dockerfile.prod -t fleetum-frontend:test .
```

After deploy verify:

```bash
curl -fsS https://fleetum.it/
curl -fsS https://fleetum.it/robots.txt
curl -fsS https://fleetum.it/sitemap.xml
curl -fsS https://fleetum.it/login
curl -fsS https://api.fleetum.it/api/ready
curl -fsS https://platform.fleetum.it/platform-api/ready
```

The home page must be the new marketing website, while `/login` must remain the
tenant application.

## Rollback

The website ships in the same immutable frontend image as the tenant static
assets. Roll back by restoring the previous frontend image tag using the
standard production rollback procedure. No database migration is involved in
this website release.
