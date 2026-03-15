-- Supabase Row Level Security policies for Prisma models.
-- Re-run this file after `prisma migrate reset` because reset removes policies.

BEGIN;

-- Public profile view for cross-user profile reads without exposing sensitive fields.
DROP VIEW IF EXISTS public."PublicUserProfile";
CREATE VIEW public."PublicUserProfile" AS
SELECT
  "id",
  "name",
  "role",
  CASE
    WHEN "id" = (SELECT auth.uid())::text THEN "address"
    WHEN EXISTS (
      SELECT 1
      FROM public."User" AS "currentUser"
      WHERE "currentUser"."id" = (SELECT auth.uid())::text
        AND "currentUser"."role" = 'ADMIN'
    ) THEN "address"
    ELSE NULL
  END AS "address",
  "createdAt"
FROM public."User";

REVOKE ALL ON public."PublicUserProfile" FROM PUBLIC;
REVOKE ALL ON public."PublicUserProfile" FROM anon;
GRANT SELECT ON public."PublicUserProfile" TO authenticated;

-- Enable RLS on all app tables.
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReportImages" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this script is idempotent.
DROP POLICY IF EXISTS "user_select_own" ON public."User";
DROP POLICY IF EXISTS "user_insert_own" ON public."User";
DROP POLICY IF EXISTS "user_update_own" ON public."User";
DROP POLICY IF EXISTS "user_delete_own" ON public."User";

DROP POLICY IF EXISTS "report_select_authenticated" ON public."Report";
DROP POLICY IF EXISTS "report_select_own" ON public."Report";
DROP POLICY IF EXISTS "report_insert_own" ON public."Report";
DROP POLICY IF EXISTS "report_update_own" ON public."Report";
DROP POLICY IF EXISTS "report_delete_own" ON public."Report";

DROP POLICY IF EXISTS "comment_select_authenticated" ON public."Comment";
DROP POLICY IF EXISTS "comment_select_own" ON public."Comment";
DROP POLICY IF EXISTS "comment_insert_own" ON public."Comment";
DROP POLICY IF EXISTS "comment_update_own" ON public."Comment";
DROP POLICY IF EXISTS "comment_delete_own" ON public."Comment";

DROP POLICY IF EXISTS "vote_select_authenticated" ON public."Vote";
DROP POLICY IF EXISTS "vote_select_own" ON public."Vote";
DROP POLICY IF EXISTS "vote_insert_own" ON public."Vote";
DROP POLICY IF EXISTS "vote_update_own" ON public."Vote";
DROP POLICY IF EXISTS "vote_delete_own" ON public."Vote";

DROP POLICY IF EXISTS "notification_select_own" ON public."Notification";
DROP POLICY IF EXISTS "notification_insert_own" ON public."Notification";
DROP POLICY IF EXISTS "notification_update_own" ON public."Notification";
DROP POLICY IF EXISTS "notification_delete_own" ON public."Notification";

DROP POLICY IF EXISTS "report_images_select_authenticated" ON public."ReportImages";
DROP POLICY IF EXISTS "report_images_select_own" ON public."ReportImages";
DROP POLICY IF EXISTS "report_images_insert_own" ON public."ReportImages";
DROP POLICY IF EXISTS "report_images_update_own" ON public."ReportImages";
DROP POLICY IF EXISTS "report_images_delete_own" ON public."ReportImages";

-- User policies.
CREATE POLICY "user_select_own" ON public."User"
  FOR SELECT TO authenticated
  USING ("id" = (SELECT auth.uid())::text);

CREATE POLICY "user_insert_own" ON public."User"
  FOR INSERT TO authenticated
  WITH CHECK ("id" = (SELECT auth.uid())::text);

CREATE POLICY "user_update_own" ON public."User"
  FOR UPDATE TO authenticated
  USING ("id" = (SELECT auth.uid())::text)
  WITH CHECK ("id" = (SELECT auth.uid())::text);

CREATE POLICY "user_delete_own" ON public."User"
  FOR DELETE TO authenticated
  USING ("id" = (SELECT auth.uid())::text);

-- Report policies.
-- Feed reports can be read by any authenticated user.
CREATE POLICY "report_select_authenticated" ON public."Report"
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "report_insert_own" ON public."Report"
  FOR INSERT TO authenticated
  WITH CHECK ("reporterId" = (SELECT auth.uid())::text);

CREATE POLICY "report_update_own" ON public."Report"
  FOR UPDATE TO authenticated
  USING ("reporterId" = (SELECT auth.uid())::text)
  WITH CHECK ("reporterId" = (SELECT auth.uid())::text);

CREATE POLICY "report_delete_own" ON public."Report"
  FOR DELETE TO authenticated
  USING ("reporterId" = (SELECT auth.uid())::text);

-- Comments are visible when the parent report is visible to the user.
CREATE POLICY "comment_select_authenticated" ON public."Comment"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."Comment"."reportId"
    )
  );

CREATE POLICY "comment_insert_own" ON public."Comment"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "comment_update_own" ON public."Comment"
  FOR UPDATE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text)
  WITH CHECK ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "comment_delete_own" ON public."Comment"
  FOR DELETE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text);

-- Vote rows are visible when the parent report is visible to the user.
CREATE POLICY "vote_select_authenticated" ON public."Vote"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."Vote"."reportId"
    )
  );

CREATE POLICY "vote_insert_own" ON public."Vote"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "vote_update_own" ON public."Vote"
  FOR UPDATE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text)
  WITH CHECK ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "vote_delete_own" ON public."Vote"
  FOR DELETE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text);

-- Notification policies.
CREATE POLICY "notification_select_own" ON public."Notification"
  FOR SELECT TO authenticated
  USING ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "notification_insert_own" ON public."Notification"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "notification_update_own" ON public."Notification"
  FOR UPDATE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text)
  WITH CHECK ("userId" = (SELECT auth.uid())::text);

CREATE POLICY "notification_delete_own" ON public."Notification"
  FOR DELETE TO authenticated
  USING ("userId" = (SELECT auth.uid())::text);

-- Report images are visible when the parent report is visible to the user.
CREATE POLICY "report_images_select_authenticated" ON public."ReportImages"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."ReportImages"."reportId"
    )
  );

CREATE POLICY "report_images_insert_own" ON public."ReportImages"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."ReportImages"."reportId"
        AND "r"."reporterId" = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "report_images_update_own" ON public."ReportImages"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."ReportImages"."reportId"
        AND "r"."reporterId" = (SELECT auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."ReportImages"."reportId"
        AND "r"."reporterId" = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "report_images_delete_own" ON public."ReportImages"
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Report" AS "r"
      WHERE "r"."id" = public."ReportImages"."reportId"
        AND "r"."reporterId" = (SELECT auth.uid())::text
    )
  );

COMMIT;
