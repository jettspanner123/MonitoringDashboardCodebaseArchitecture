-- Applied by hand via scripts/RunManualSql.ts, NOT `prisma migrate` - see
-- prisma/schema.prisma's header comment. Mirrors ClientMachine,
-- ConfigurationConstant, ClientMachineServiceAction, and
-- ClientMachineRefreshToken column-for-column, then seeds the two known VMs
-- and their default curated services.
--
-- MD_ConfigurationConstantTBL mirrors AssetSphere's AS_ConfigurationConstantTBL
-- and SignForge's SF_ConfigurationConstantTBL (verified against SignForge's
-- live Supabase schema) - same generic key-value shape across all 3 apps.

CREATE TABLE "MD_ClientMachineConstantTBL" (
  "id" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_ClientMachineConstantTBL_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MD_ClientMachineConstantTBL_hostname_key" ON "MD_ClientMachineConstantTBL"("hostname");

CREATE TABLE "MD_ConfigurationConstantTBL" (
  "id" TEXT NOT NULL,
  "configurationKey" TEXT NOT NULL,
  "configurationValue" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL DEFAULT 'system',
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_ConfigurationConstantTBL_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MD_ConfigurationConstantTBL_configurationKey_key" ON "MD_ConfigurationConstantTBL"("configurationKey");

CREATE TABLE "MD_ClientMachineServiceActionAuditTBL" (
  "id" TEXT NOT NULL,
  "machineId" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "succeeded" BOOLEAN NOT NULL,
  "errorMessage" TEXT,
  "durationMs" INTEGER NOT NULL,
  CONSTRAINT "MD_ClientMachineServiceActionAuditTBL_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MD_ClientMachineServiceActionAuditTBL_machineId_fkey"
    FOREIGN KEY ("machineId") REFERENCES "MD_ClientMachineConstantTBL"("id")
);

CREATE TABLE "MD_ClientMachineRefreshTokenTBL" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "encryptedPassword" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "MD_ClientMachineRefreshTokenTBL_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MD_ClientMachineRefreshTokenTBL_refreshTokenHash_key" ON "MD_ClientMachineRefreshTokenTBL"("refreshTokenHash");

-- Seed: the two known target VMs. vmt10008847e002 is seeded first (it's the
-- earlier/longer-known of the two), so it's the one the login-check in
-- ClientMachineAuthService tries first when validating credentials.
INSERT INTO "MD_ClientMachineConstantTBL" ("id", "hostname", "nickname", "createdAt")
VALUES
  ('machine_vmt10008847e002', 'vmt10008847e002', 'vmt10008847e002', CURRENT_TIMESTAMP),
  ('machine_vms10008847e003', 'vms10008847e003', 'vms10008847e003', CURRENT_TIMESTAMP);

-- Seed: default curated services, identical list for both machines for now
-- (user-provided, not invented: XPDMEventOrchestrator and
-- 3d-kafka-integration). One row per machine, keyed
-- "ClientMachineDefaultServices:<hostname>" - edit configurationValue
-- directly (a JSON array of service names) to change a machine's curated
-- list later, no migration needed.
INSERT INTO "MD_ConfigurationConstantTBL"
  ("id", "configurationKey", "configurationValue", "description", "isActive", "createdBy", "createdAt", "updatedAt")
VALUES
  (
    'config_client_machine_default_services_vmt10008847e002',
    'ClientMachineDefaultServices:vmt10008847e002',
    '["XPDMEventOrchestrator","3d-kafka-integration"]',
    'Curated default services shown on the Client Machines page for vmt10008847e002.',
    true,
    'system',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'config_client_machine_default_services_vms10008847e003',
    'ClientMachineDefaultServices:vms10008847e003',
    '["XPDMEventOrchestrator","3d-kafka-integration"]',
    'Curated default services shown on the Client Machines page for vms10008847e003.',
    true,
    'system',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
