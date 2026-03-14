-- Negative test: this file is expected to FAIL.
-- Purpose: verify enum constraints are enforced.
-- Run with: npx prisma db execute --file prisma/test-negative.sql

BEGIN;

WITH u AS (
  INSERT INTO "User" (
    id,
    name,
    email,
    password,
    role,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    'test-user-neg-' || md5(random()::text || clock_timestamp()::text),
    'DB Test User Negative',
    'dbtest-neg+' || md5(random()::text || clock_timestamp()::text) || '@mail.com',
    'secret123',
    'USER'::"Role",
    now(),
    now()
  )
  RETURNING id
)
INSERT INTO "Notification" (
  id,
  "userId",
  title,
  message,
  type,
  "isRead",
  "createdAt"
)
SELECT
  'test-notif-neg-' || md5(random()::text || clock_timestamp()::text),
  id,
  'Bad Notif',
  'Expected fail (enum)',
  'INVALID_TYPE',
  false,
  now()
FROM u;

ROLLBACK;
