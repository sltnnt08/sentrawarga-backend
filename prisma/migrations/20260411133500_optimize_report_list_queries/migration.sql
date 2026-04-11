-- Accelerate report listing and filtering queries
CREATE INDEX IF NOT EXISTS "Report_createdAt_idx"
ON "Report"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx"
ON "Report"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Report_priority_createdAt_idx"
ON "Report"("priority", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Report_reporterId_createdAt_idx"
ON "Report"("reporterId", "createdAt" DESC);

-- Speeds up `category has` filter on enum[]
CREATE INDEX IF NOT EXISTS "Report_category_gin_idx"
ON "Report" USING GIN ("category");

-- Speeds up reportImages existence checks and joins
CREATE INDEX IF NOT EXISTS "ReportImages_reportId_idx"
ON "ReportImages"("reportId");
