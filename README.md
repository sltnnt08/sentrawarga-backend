# SentraWarga Backend

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Required-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)

Backend API untuk SentraWarga berbasis **Express + Prisma + PostgreSQL (Supabase sebagai cloud database utama)**.
Dokumen ini dibuat untuk dua audiens sekaligus:

- Reviewer profesional yang butuh gambaran arsitektur, kualitas, dan deployment dengan cepat.
- Pemula yang butuh langkah setup yang jelas dari nol.

## Highlights

- Struktur modular (controller, service, validator, middleware).
- Validasi request berbasis Zod.
- Auth JWT + role-based authorization (contoh: admin-only action).
- Health endpoint (`/healthz`) dan readiness endpoint (`/readyz`).
- Test campuran: Node test runner + Postman/Newman.
- Deploy didukung via Docker dan Render.com.

## Table of Contents

- [1) Prerequisites](#1-prerequisites)
- [2) Quick Start (5 Menit)](#2-quick-start-5-menit)
- [3) Environment Variables](#3-environment-variables)
- [4) API Surface Ringkas](#4-api-surface-ringkas)
- [5) Database Migration dan RLS](#5-database-migration-dan-rls)
- [6) Testing dan Quality Gate](#6-testing-dan-quality-gate)
- [7) Deployment](#7-deployment)
- [8) Security Notes](#8-security-notes)
- [9) Referensi Project](#9-referensi-project)

## 1) Prerequisites

- Node.js 22 atau lebih baru.
- Akses ke PostgreSQL. Rekomendasi project ini: pakai **Supabase Postgres** untuk environment cloud.
- NPM (ikut bersama instalasi Node.js).

## 2) Quick Start (5 Menit)

1. Install dependency:

```bash
npm ci
```

2. Buat file `.env` dari contoh lalu isi nilainya:

```bash
cp .env.example .env
```

Untuk PowerShell:

```powershell
Copy-Item .env.example .env
```

Untuk setup standar project ini, isi `DATABASE_URL` (Supabase pooler) dan `DIRECT_URL` (direct connection Supabase) di `.env`.

3. Generate Prisma Client:

```bash
npx prisma generate
```

4. Jalankan migration:

```bash
npm run migrate
```

5. Jalankan server development:

```bash
npm run dev
```

6. Verifikasi cepat:

- `GET /` -> API running.
- `GET /healthz` -> liveness.
- `GET /readyz` -> readiness + DB check.

## 3) Environment Variables

Sumber konfigurasi ada di file `.env`.

| Variable               | Required   | Keterangan                                                  |
| ---------------------- | ---------- | ----------------------------------------------------------- |
| `NODE_ENV`             | Ya         | `development` \| `test` \| `production`                     |
| `PORT`                 | Ya         | Port HTTP server                                            |
| `DATABASE_URL`         | Ya         | Koneksi utama aplikasi (disarankan Supabase Session Pooler) |
| `DIRECT_URL`           | Disarankan | Koneksi direct ke DB (dipakai Prisma untuk migration)       |
| `LOCAL_DATABASE_URL`   | Opsional   | Fallback untuk local PostgreSQL/testing lokal               |
| `CORS_ORIGIN`          | Ya         | Single origin atau allowlist dipisah koma                   |
| `JWT_SECRET`           | Ya         | Minimal 16 karakter                                         |
| `JWT_EXPIRES_IN`       | Ya         | Contoh: `1d`, `7d`                                          |
| `BODY_LIMIT`           | Ya         | Batas ukuran body request                                   |
| `RATE_LIMIT_WINDOW_MS` | Ya         | Window rate limit global                                    |
| `RATE_LIMIT_MAX`       | Ya         | Maksimum request per window                                 |
| `AUTH_RATE_LIMIT_MAX`  | Ya         | Maksimum request untuk endpoint auth                        |
| `TRUST_PROXY`          | Opsional   | Set `true` jika di belakang proxy/load balancer             |

## 4) API Surface Ringkas

Base path API: `/api`

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me` (auth required)
- Reports:
  - `GET /api/reports`
  - `POST /api/reports` (auth required)
  - `GET /api/reports/:id`
  - `PATCH /api/reports/:id/status` (admin only)
- Comments:
  - `GET /api/reports/:reportId/comments`
  - `POST /api/reports/:reportId/comments` (auth required)
- Votes:
  - `GET /api/reports/:reportId/votes`
  - `POST /api/reports/:reportId/votes` (auth required)
  - `DELETE /api/reports/:reportId/votes` (auth required)
- Notifications (seluruh route butuh auth):
  - `GET /api/notifications`
  - `PATCH /api/notifications/read-all`
  - `PATCH /api/notifications/:id/read`

Dokumentasi detail endpoint tersedia di `openapi.yaml`.

## 5) Database Migration dan RLS

### Migration

- Prisma CLI pada project ini akan memakai `DIRECT_URL` jika tersedia, lalu fallback ke `DATABASE_URL`.
- Untuk Supabase: gunakan URL direct (`db.<project-ref>.supabase.co`) pada `DIRECT_URL` agar migrate lebih stabil.

- Deploy migration:

```bash
npm run migrate
```

- Reset migration (development only):

```bash
npm run migrate:reset
```

### RLS Policy (Penting)

RLS **dikelola manual** dari SQL file:

- Source of truth: `rls_policies.sql`
- Jangan gunakan script automation/helper untuk apply/validate RLS.
- Setelah perubahan schema atau reset DB, apply `rls_policies.sql` secara manual lewat Supabase SQL Editor atau SQL client.

View `public."PublicUserProfile"` juga didefinisikan dari `rls_policies.sql`.

## 6) Testing dan Quality Gate

### Menjalankan test

```bash
npm test
npm run test:postman
npm run test:all
```

### Lint

```bash
npm run lint
```

### Postman artifacts

- Collection: `postman/SentraWarga Backend.postman_collection.json`
- Environment: `postman/SentraWarga Local.postman_environment.json`
- Newman JUnit report: `reports/newman/newman.xml`

### GitHub Actions workflow

Workflow aktif ada di `.github/workflows/deploy.yml`:

- Job `test`: checkout, setup Node.js, install dependency, generate Prisma Client, lalu `npm test`
- Job `deploy`: trigger deploy ke Render via `RENDER_DEPLOY_HOOK` (jalan setelah job `test` sukses)

## 7) Deployment

### 1) Docker

```bash
docker build -t sentrawarga-backend:latest .
docker run --rm -p 3000:3000 --env-file .env sentrawarga-backend:latest
```

### 2) Render.com

Build command yang direkomendasikan:

```bash
npm run build:render
```

Deploy dipicu dari GitHub Actions workflow `Deploy to Render` di `.github/workflows/deploy.yml`.

Catatan penting untuk Render + Supabase:

- Render tidak butuh PostgreSQL internal jika `DATABASE_URL` dan `DIRECT_URL` sudah diarahkan ke Supabase.
- Minimal set environment variable di Render: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`.
- Dengan konfigurasi ini, service Render tetap stateless dan database cloud tetap ditangani Supabase.

## 8) Security Notes

- Helmet untuk security headers.
- Rate limiting global dan rate limiting khusus auth endpoint.
- Request ID dikirim via header `X-Request-Id`.
- Error response menyertakan `requestId` untuk traceability.
- Pada production, detail error internal dimasking menjadi pesan generik.

## 9) Referensi Project

- OpenAPI spec: `openapi.yaml`
- Prisma schema: `prisma/schema.prisma` (+ file split schema lainnya di folder `prisma`)
- App entrypoint: `src/server.js`
- Express app wiring: `src/app.js`

## Known Residual Risk

Masih ada transitive vulnerability dari toolchain Prisma saat `npm audit --omit=dev`.
Perbaikannya membutuhkan major upgrade/dependency shift, jadi mitigasi saat ini adalah menjaga dependency tetap up to date dan rutin monitor advisory.
