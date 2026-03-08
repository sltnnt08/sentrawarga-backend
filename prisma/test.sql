-- DB structure insert test for SentraWarga
-- Run with: npx prisma db execute --file prisma/test.sql
-- This script does NOT persist data because it ends with ROLLBACK.

BEGIN;

-- Keep generated IDs across statements.
CREATE TEMP TABLE _test_ctx (
  user_id TEXT,
  report_id TEXT
) ON COMMIT DROP;

-- 1) Insert user
WITH u AS (
  INSERT INTO "User" (
    id,
    name,
    email,
    password,
    address,
    role,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    'test-user-' || md5(random()::text || clock_timestamp()::text),
    'DB Test User',
    'dbtest+' || md5(random()::text || clock_timestamp()::text) || '@mail.com',
    'secret123',
    'Test Address',
    'USER'::"Role",
    now(),
    now()
  )
  RETURNING id
)
INSERT INTO _test_ctx (user_id)
SELECT id FROM u;

-- 2) Insert report (depends on user)
WITH r AS (
  INSERT INTO "Report" (
    id,
    title,
    description,
    category,
    priority,
    latitiude,
    longitude,
    address,
    "resolvedAt",
    status,
    "createdAt",
    "updatedAt",
    "reporterId"
  )
  SELECT
    'test-report-' || md5(random()::text || clock_timestamp()::text),
    'Laporan Uji Struktur DB',
    'Cek insert lintas tabel',
    ARRAY['TRASH'::"Category", 'FLOOD'::"Category"],
    'NORMAL'::"Priority",
    -6.200000,
    106.800000,
    'Jl. Uji Struktur',
    NULL,
    'PENDING'::"ReportStatus",
    now(),
    now(),
    user_id
  FROM _test_ctx
  RETURNING id
)
UPDATE _test_ctx
SET report_id = (SELECT id FROM r);

-- 3) Insert vote
INSERT INTO "Vote" (
  id,
  "userId",
  "reportId",
  type
)
SELECT
  'test-vote-' || md5(random()::text || clock_timestamp()::text),
  user_id,
  report_id,
  'UP'::"VoteType"
FROM _test_ctx;

-- 4) Insert comment
INSERT INTO "Comment" (
  id,
  content,
  "reportId",
  "userId",
  "createdAt",
  "updatedAt"
)
SELECT
  'test-comment-' || md5(random()::text || clock_timestamp()::text),
  'Komentar uji struktur',
  report_id,
  user_id,
  now(),
  now()
FROM _test_ctx;

-- 5) Insert report image (mapped table name: ReportImages)
INSERT INTO "ReportImages" (
  id,
  url,
  "reportId"
)
SELECT
  'test-image-' || md5(random()::text || clock_timestamp()::text),
  'https://example.com/test.jpg',
  report_id
FROM _test_ctx;

-- 6) Insert notification
INSERT INTO "Notification" (
  id,
  "userId",
  title,
  message,
  type,
  "isRead",
  "relatedId",
  "createdAt"
)
SELECT
  'test-notif-' || md5(random()::text || clock_timestamp()::text),
  user_id,
  'Notif Uji',
  'Testing insert notification',
  'NEW_COMMENT'::"NotificationType",
  false,
  report_id,
  now()
FROM _test_ctx;

ROLLBACK;
