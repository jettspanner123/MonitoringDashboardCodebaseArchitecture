-- Applied by hand via scripts/RunManualSql.ts, NOT `prisma migrate` - see
-- prisma/schema.prisma's header comment. Seeds SignForge the same way
-- 002_add_application_monitor.sql seeded AssetSphere - SignForge's backend
-- exposes the identical Api/V1/HealthCheck(/Ping) convention.

INSERT INTO "MD_ApplicationConstantTBL" ("id", "slug", "name", "baseUrl", "iconName", "createdAt")
VALUES (
  'app_signforge',
  'signforge',
  'SignForge',
  'https://signforgeappcodebasearchitecture-prod.onrender.com',
  'FileSignature',
  CURRENT_TIMESTAMP
);

INSERT INTO "MD_ApplicationEndpointConstantTBL"
  ("id", "applicationId", "label", "checkType", "config", "sortOrder", "isActive", "createdAt")
VALUES
  (
    'endpoint_signforge_ping',
    'app_signforge',
    'Ping',
    'HttpEndpoint',
    '{"method":"GET","path":"/Api/V1/HealthCheck/Ping","expectedStatusCode":200}',
    0,
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'endpoint_signforge_healthcheck',
    'app_signforge',
    'Health Check',
    'HttpEndpoint',
    '{"method":"GET","path":"/Api/V1/HealthCheck","expectedStatusCode":200}',
    1,
    true,
    CURRENT_TIMESTAMP
  );
