-- Applied by hand via scripts/RunManualSql.ts, NOT `prisma migrate` - see
-- prisma/schema.prisma's header comment. Mirrors MonitoredApplication,
-- ApplicationEndpoint, and ApplicationEndpointHit column-for-column, then
-- seeds AssetSphere and its two real endpoints (Ping, HealthCheck).

CREATE TABLE "MD_ApplicationConstantTBL" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "iconName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_ApplicationConstantTBL_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MD_ApplicationConstantTBL_slug_key" ON "MD_ApplicationConstantTBL"("slug");

CREATE TABLE "MD_ApplicationEndpointConstantTBL" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "checkType" TEXT NOT NULL,
  "config" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_ApplicationEndpointConstantTBL_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MD_ApplicationEndpointConstantTBL_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "MD_ApplicationConstantTBL"("id")
);

CREATE TABLE "MD_ApplicationEndpointHitHistoryTBL" (
  "id" TEXT NOT NULL,
  "endpointId" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "statusCode" INTEGER,
  "responseBody" TEXT,
  "durationMs" INTEGER NOT NULL,
  "errorMessage" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_ApplicationEndpointHitHistoryTBL_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MD_ApplicationEndpointHitHistoryTBL_endpointId_fkey"
    FOREIGN KEY ("endpointId") REFERENCES "MD_ApplicationEndpointConstantTBL"("id")
);

-- Seed: AssetSphere + its two real, verified-live endpoints.
INSERT INTO "MD_ApplicationConstantTBL" ("id", "slug", "name", "baseUrl", "iconName", "createdAt")
VALUES (
  'app_assetsphere',
  'assetsphere',
  'AssetSphere',
  'https://assetsphereappcodebasearchitecture-op10.onrender.com',
  'Boxes',
  CURRENT_TIMESTAMP
);

INSERT INTO "MD_ApplicationEndpointConstantTBL"
  ("id", "applicationId", "label", "checkType", "config", "sortOrder", "isActive", "createdAt")
VALUES
  (
    'endpoint_assetsphere_ping',
    'app_assetsphere',
    'Ping',
    'HttpEndpoint',
    '{"method":"GET","path":"/Api/V1/HealthCheck/Ping","expectedStatusCode":200}',
    0,
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'endpoint_assetsphere_healthcheck',
    'app_assetsphere',
    'Health Check',
    'HttpEndpoint',
    '{"method":"GET","path":"/Api/V1/HealthCheck","expectedStatusCode":200}',
    1,
    true,
    CURRENT_TIMESTAMP
  );
