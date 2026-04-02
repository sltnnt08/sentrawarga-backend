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
- [7) Fitur Klasifikasi AI Laporan](#7-fitur-klasifikasi-ai-laporan)
- [8) Deployment](#8-deployment)
- [9) Security Notes](#9-security-notes)
- [10) Referensi Project](#10-referensi-project)

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
| `SENDPULSE_SMTP_HOST`  | Opsional   | Host SMTP SendPulse (default: `smtp-pulse.com`)             |
| `SENDPULSE_SMTP_PORT`  | Opsional   | Port SMTP (umum: `465`, `2525`, `587`)                      |
| `SENDPULSE_SMTP_SECURE`| Opsional   | `true` untuk SSL langsung (`465`), selain itu `false`       |
| `SENDPULSE_SMTP_USER`  | Opsional   | Username SMTP SendPulse                                      |
| `SENDPULSE_SMTP_PASS`  | Opsional   | Password SMTP SendPulse                                      |
| `SENDPULSE_FROM_EMAIL` | Opsional   | Sender email (contoh: `no-reply@domain.com`)                |
| `SENDPULSE_REPLY_TO`   | Opsional   | Alamat balasan email                                         |
| `SENDPULSE_TEST_TO`    | Opsional   | Tujuan email untuk `npm run test:sendpulse`                 |
| `GOOGLE_CLIENT_ID`     | Opsional   | Wajib diisi jika ingin mengaktifkan login/daftar Google     |
| `GEMINI_API_KEY`       | Opsional   | API key Gemini untuk fitur klasifikasi otomatis laporan     |

Catatan SMTP SendPulse:

- Kombinasi umum yang aman: `465 + secure=true`, `2525 + secure=false`, `587 + secure=false`.
- Jika `SENDPULSE_SMTP_USER/PASS/FROM_EMAIL` kosong, backend akan fallback ke mode log (email tidak benar-benar dikirim).
- Untuk verifikasi cepat SMTP, jalankan `npm run test:sendpulse` setelah mengisi `SENDPULSE_TEST_TO`.

## 4) API Surface Ringkas

Base path API: `/api`

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/google`
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

**Test dengan Fitur Klasifikasi AI:**

Suite test mencakup 18 test cases meliputi:

- **AI Service Integration (8 tests)** - validasi service klasifikasi laporan
  - Fallback behavior saat API gagal
  - Validasi kategori terhadap enum yang tersedia
  - Validasi confidence score (0.0-1.0)
  - Konsistensi struktur response
  - Handling image opsional

- **Report API Integration (10 tests)** - validasi endpoint laporan dengan AI
  - Pembuatan laporan dengan field AI classification
  - Inclusion AI fields dalam response
  - Graceful fallback saat API gagal
  - Berbagai panjang deskripsi
  - Validasi field types dan values

Test detail tersedia di:

- `test/ai-integration.test.js` - AI service tests
- `test/app.test.js` - API integration tests

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

## 7) Fitur Klasifikasi AI Laporan

Aplikasi terintegrasi dengan Google Gemini API (gemini-2.5-flash-lite) untuk klasifikasi otomatis laporan.

### Fitur Utama

- **Klasifikasi Multi-modal**: Menerima deskripsi teks dan gambar base64 dalam satu API call
- **Input Fleksibel**: Gambar opsional, fokus pada deskripsi teks sebagai primary input
- **Validasi Kategori**: Memvalidasi response terhadap enum kategori aktual (CRIMINAL, TRASH, FLOOD, POLLUTION, ROADS_ISSUE, PUBLIC_DISTURBANCE, ACCIDENTS, OTHERS)
- **Confidence Scoring**: Menghasilkan nilai confidence 0.0-1.0
- **Spam Detection**: Flag boolean untuk deteksi laporan spam
- **Graceful Degradation**: Laporan tetap tersimpan meskipun AI API gagal (fallback dengan nilai null/false)

### Konfigurasi

Sebelum production, pastikan:

1. Set `GEMINI_API_KEY` di file `.env` (diperoleh dari [Google AI Studio](https://aistudio.google.com/))
2. Verifikasi database migration sudah applied: `npm run migrate`
3. Test dengan sample laporan termasuk image
4. Monitor usage dan rate limits API (quota: 10 requests/menit di free tier)

### Implementasi Teknis

#### File yang Diubah

1. **src/config/env.js** - Validasi GEMINI_API_KEY dengan Zod
2. **src/services/ai-service.js** - Service klasifikasi laporan
   - Fungsi: `klasifikasiLaporan(options)`
   - Parameter: `deskripsi` (required), `fotoBase64` (optional), `mimeType` (default: 'image/jpeg')
   - Return: Object dengan `category`, `confidenceScore`, `isSpam`, `aiError`
3. **src/services/report-service.js** - Integrasi AI saat membuat laporan
4. **src/validators/report-validator.js** - Field baru: `imageBase64`, `imageMimeType`
5. **prisma/reports.prisma** - Tiga field baru di model Report:
   - `aiCategory`: Category (nullable) - kategori prediksi AI
   - `aiConfidence`: Float (nullable) - confidence score (0.0-1.0)
   - `aiSpamFlag`: Boolean (nullable) - flag spam detection
6. **Migration**: `prisma/migrations/20260328082221_add_ai_classification_fields`

#### Response Fallback (saat API gagal)

```javascript
{
  category: null,
  confidenceScore: null,
  isSpam: false,
  aiError: true
}
```

### Contoh API Usage

```bash
POST /api/reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Sampah Menumpuk",
  "description": "Terdapat sampah plastik yang sangat banyak menumpuk di samping toko elektronik menyebabkan polusi visual dan lingkungan",
  "category": ["TRASH"],
  "priority": "HIGH",
  "address": "Jl. Merdeka No. 123, Jakarta",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "imageBase64": "base64-encoded-image-data",
  "imageMimeType": "image/jpeg"
}
```

Response mencakup field AI classification:

```json
{
  "success": true,
  "message": "Report created",
  "data": {
    "id": "uuid",
    "title": "Sampah Menumpuk",
    "description": "...",
    "category": ["TRASH"],
    "aiCategory": "TRASH",
    "aiConfidence": 0.95,
    "aiSpamFlag": false,
    "status": "PENDING",
    ...
  }
}
```

### Security

✅ **API Key Protection**

- GEMINI_API_KEY hanya digunakan server-side di ai-service.js
- Tidak pernah exposed di API response atau frontend
- Divalidasi melalui env.js sebelum digunakan

✅ **Error Handling**

- Error handler mencegah API failure memblokir laporan creation
- Error messages logged ke console untuk debugging
- Tidak ada sensitive info yang bocor di error response

✅ **Input Validation**

- Deskripsi laporan: 10-3000 karakter
- Image base64: optional
- MIME type: validated/defaulted
- Kategori response: validated terhadap enum

### Database Behavior

Saat laporan dibuat:

1. AI service dipanggil dengan deskripsi + image (opsional)
2. Jika sukses: tiga field AI terisi dengan nilai
3. Jika gagal: tiga field AI di-set ke null/false, laporan tetap tersimpan
4. Semua laporan queryable dengan AI fields included di response

### Pattern Kode yang Diikuti

✅ ES6 modules (import/export)  
✅ Async/await error handling  
✅ Service layer architecture  
✅ Validator + service + controller pattern  
✅ Prisma ORM untuk database operations  
✅ Zod untuk environment validation  
✅ Naming convention existing (fungsi bahasa Indonesia di service layer)

## 8) Deployment

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
- Contoh nilai `CORS_ORIGIN` produksi: `https://sentrawarga.my.id,https://www.sentrawarga.my.id`.
- Set `APP_BASE_URL=https://sentrawarga.my.id` untuk link verifikasi email dan reset password.
- Dengan konfigurasi ini, service Render tetap stateless dan database cloud tetap ditangani Supabase.

## 9) Security Notes

- Helmet untuk security headers.
- Rate limiting global dan rate limiting khusus auth endpoint.
- Request ID dikirim via header `X-Request-Id`.
- Error response menyertakan `requestId` untuk traceability.
- Pada production, detail error internal dimasking menjadi pesan generik.

## 10) Referensi Project

- OpenAPI spec: `openapi.yaml`
- Prisma schema: `prisma/schema.prisma` (+ file split schema lainnya di folder `prisma`)
- App entrypoint: `src/server.js`
- Express app wiring: `src/app.js`

## Known Residual Risk

Masih ada transitive vulnerability dari toolchain Prisma saat `npm audit --omit=dev`.
Perbaikannya membutuhkan major upgrade/dependency shift, jadi mitigasi saat ini adalah menjaga dependency tetap up to date dan rutin monitor advisory.
