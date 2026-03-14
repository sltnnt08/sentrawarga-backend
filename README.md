# SentraWarga Backend

Production-oriented Express + Prisma backend for SentraWarga.

## Requirements

- Node.js 22+
- PostgreSQL

## Environment Variables

Copy and adjust values in `.env`.

- `NODE_ENV` (`development` | `test` | `production`)
- `PORT`
- `DATABASE_URL`
- `DIRECT_URL` (direct DB connection used by Prisma migrations)
- `CORS_ORIGIN` (single origin or comma-separated allowlist)
- `JWT_SECRET` (minimum 16 characters)
- `JWT_EXPIRES_IN`
- `BODY_LIMIT`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_MAX`
- `TRUST_PROXY`

## Run

```bash
npm ci
npx prisma generate
npm run dev
```

Run automated tests:

```bash
npm test
npm run test:postman
npm run test:all
```

Production mode:

```bash
npm ci --omit=dev
npm start
```

For managed Postgres providers that expose pooled and direct URLs (for example Supabase), run migrations using direct URL:

```bash
npm run migrate:deploy
```

## Health Endpoints

- `GET /healthz`: liveness
- `GET /readyz`: readiness (checks DB query)

## API Documentation

OpenAPI spec is available at `openapi.yaml`.

## Postman

- Collection: `postman/SentraWarga Backend.postman_collection.json`
- Environment: `postman/SentraWarga Local.postman_environment.json`

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Includes:

- `npm ci`
- `npm run lint`
- `npx prisma generate`
- `npm test`
- `npm run test:postman`
- runtime dependency audit (`npm audit --omit=dev`, non-blocking)

Postman JUnit report output:

- `reports/newman/newman.xml`

## Non-Docker Production Deployment

Using PM2:

```bash
npm ci --omit=dev
npx prisma generate
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Nginx reverse proxy example is provided in `deploy-nginx.conf.example`.

If deployed behind proxy/load balancer, set:

- `TRUST_PROXY=true`

## Docker

Build and run:

```bash
docker build -t sentrawarga-backend:latest .
docker run --rm -p 3000:3000 --env-file .env sentrawarga-backend:latest
```

## Security Notes

- Security headers enabled through Helmet.
- Global and auth-specific rate limiting enabled.
- Request IDs are attached to responses via `X-Request-Id`.
- Error responses include requestId for traceability.
- In production, server errors are masked to generic messages.

## Known Residual Risk

Current transitive vulnerabilities are reported from Prisma toolchain dependencies during `npm audit --omit=dev` and require major dependency changes to fully resolve. Keep dependencies updated and monitor advisories.
