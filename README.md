# SentraWarga Backend

Backend ini adalah pusat data dan logika untuk aplikasi SentraWarga.
Tugas utamanya menerima laporan warga, menyimpan data, mengelola akun, dan memberi data ke frontend.

Dokumen ini ditulis dengan bahasa sederhana agar mudah dipahami, termasuk untuk orang non-teknis.

## 1. Gambaran Singkat

Fungsi backend di proyek ini:

- Menyediakan API untuk login, pendaftaran, laporan, komentar, vote, notifikasi, dan data wilayah.
- Menyimpan data ke PostgreSQL (umumnya Supabase Postgres).
- Mendukung upload foto laporan ke Supabase Storage.
- Mendukung klasifikasi kategori laporan dengan AI (Gemini), tapi tetap aman jika AI gagal.

## 2. Teknologi yang Dipakai

- Node.js + Express
- Prisma ORM
- PostgreSQL
- Zod (validasi input)
- JWT (autentikasi)
- Newman/Postman + Node test runner (pengujian)

## 3. Struktur Folder Penting

- `src/app.js`: susunan middleware, route, error handler.
- `src/server.js`: proses start server.
- `src/routes`: daftar endpoint API.
- `src/services`: logika bisnis.
- `src/controllers`: jembatan request ke service.
- `prisma/`: schema dan migration database.
- `openapi.yaml`: dokumentasi endpoint.

## 4. Cara Menjalankan Lokal (Cepat)

1) Masuk ke folder backend.

2) Install dependency:

```bash
npm ci
```

3) Buat file environment:

```bash
cp .env.example .env
```

4) Isi minimal variabel di `.env`:

- `DATABASE_URL`
- `JWT_SECRET` (minimal 16 karakter)

5) Generate Prisma client:

```bash
npx prisma generate
```

6) Jalankan migration:

```bash
npm run migrate
```

7) Jalankan server development:

```bash
npm run dev
```

Server default berjalan di `http://localhost:3000`.

## 5. Cek Backend Sudah Jalan

Endpoint pemeriksaan cepat:

- `GET /` -> respons API running.
- `GET /healthz` -> cek backend hidup.
- `GET /readyz` -> cek backend + koneksi database.
- Versi dengan prefix API juga tersedia: `/api/healthz` dan `/api/readyz`.

## 6. Variabel Environment Penting

Semua contoh ada di file `.env.example`.

Paling penting untuk awal:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`

Sering dipakai di proyek ini:

- `CORS_ORIGIN`
- `JWT_EXPIRES_IN`
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`
- `APP_BASE_URL` (untuk link verifikasi email dan reset password)

Opsional sesuai fitur:

- Email SMTP SendPulse: `SENDPULSE_*`
- Google Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Supabase Auth helper: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Upload foto laporan ke Supabase Storage: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_REPORT_IMAGE_BUCKET`, `SUPABASE_REPORT_IMAGE_PUBLIC_BASE_URL`
- Klasifikasi AI: `GEMINI_API_KEY`

Catatan Prisma URL:

- Default Prisma CLI memakai `DATABASE_URL`.
- Jika ingin memaksa pakai `DIRECT_URL`, set `PRISMA_CLI_USE_DIRECT_URL=true`.

## 7. Ringkasan Endpoint

Route utama API ada di prefix `/api`.

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/callback`
- `GET /api/auth/me`

Laporan:

- `GET /api/reports`
- `GET /api/reports/stats`
- `POST /api/reports/classify`
- `POST /api/reports`
- `GET /api/reports/:id`
- `PATCH /api/reports/:id`
- `PATCH /api/reports/:id/status`

Komentar dan vote:

- `GET /api/reports/:reportId/comments`
- `POST /api/reports/:reportId/comments`
- `GET /api/reports/:reportId/votes`
- `POST /api/reports/:reportId/votes`
- `DELETE /api/reports/:reportId/votes`

Notifikasi:

- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read`

Data wilayah:

- `GET /api/wilayah/provinces.json`
- `GET /api/wilayah/regencies/:provinceCode.json`
- `GET /api/wilayah/districts/:regencyCode.json`
- `GET /api/wilayah/villages/:districtCode.json`

Catatan kompatibilitas:

- Endpoint auth juga dipasang di `/auth/*` (tanpa prefix `/api`) untuk kebutuhan kompatibilitas.

## 8. Perintah Penting

Jalankan dev:

```bash
npm run dev
```

Jalankan production mode lokal:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Test unit/integration (Node test runner):

```bash
npm test
```

Test Postman/Newman:

```bash
npm run test:postman
```

Semua test:

```bash
npm run test:all
```

Generate JWT secret:

```bash
npm run gen:jwt-secret
```

## 9. Tentang Test Postman

Script `npm run test:postman` memakai collection di folder `postman/`.

Perilaku penting:

- Default `POSTMAN_BASE_URL` mengarah ke `https://sentrawarga-backend.onrender.com`.
- Jika URL target tidak sehat, script akan mencoba menjalankan server lokal sementara.
- Hasil report JUnit ditulis ke `reports/newman/newman.xml`.

## 10. Deploy Singkat

Docker:

```bash
docker build -t sentrawarga-backend:latest .
docker run --rm -p 3000:3000 --env-file .env sentrawarga-backend:latest
```

Render:

- Build command yang disiapkan: `npm run build:render`
- Workflow deploy ada di `.github/workflows/deploy.yml`

## 11. Catatan Operasional

- File `rls_policies.sql` dipakai untuk kebijakan RLS dan view terkait.
- Pada mode production, `JWT_SECRET` tidak boleh memakai nilai default.
- Saat AI gagal, pembuatan laporan tetap jalan (fallback aman), sehingga layanan tidak berhenti total.

## 12. Referensi

- OpenAPI: `openapi.yaml`
- Prisma config: `prisma.config.ts`
- Entry app: `src/app.js`
- Entry server: `src/server.js`

## 13. Kredit Data Wilayah

Terima kasih untuk repository berikut:

- https://github.com/cahyadsn/wilayah

Repository tersebut membantu penyediaan API data wilayah Indonesia (provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan) yang akurat dan terbarui untuk kebutuhan fitur wilayah di SentraWarga.
