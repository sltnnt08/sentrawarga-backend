DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'ReportStatus'
          AND e.enumlabel = 'CANCELLED'
    ) THEN
        ALTER TYPE "ReportStatus" ADD VALUE 'CANCELLED';
    END IF;
END $$;

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "cancelledByRole" "Role";
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "editedByReporter" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "lastEditedByReporterAt" TIMESTAMP(3);
