-- Applied by hand via scripts/RunManualSql.ts, NOT `prisma migrate` - see
-- prisma/schema.prisma's header comment. Adds MD_GeneratedReportTBL, the
-- immutable snapshot each "Generate Report" run produces (see
-- specs/001-generate-report) - selectedKeys/content are JSON text, mirroring
-- MD_ApplicationEndpointConstantTBL.config's existing free-form-JSON-as-text
-- convention rather than a new Postgres json/jsonb column type.

CREATE TABLE "MD_GeneratedReportTBL" (
  "id" TEXT NOT NULL,
  "environment" "Environment" NOT NULL,
  "rangeStart" TIMESTAMP(3) NOT NULL,
  "rangeEnd" TIMESTAMP(3) NOT NULL,
  "selectedKeys" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_GeneratedReportTBL_pkey" PRIMARY KEY ("id")
);
