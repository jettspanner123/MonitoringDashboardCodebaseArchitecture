-- Applied by hand via scripts/RunManualSql.ts, NOT `prisma migrate` - see
-- prisma/schema.prisma's header comment.
--
-- 003_add_client_machine_services.sql seeded "3d-kafka-integration" - the
-- real service name on both machines is "3dx-kafka-integration" (confirmed
-- by the user after the curated card showed "no such service" - sc.exe
-- matches the name literally, so even one missing character fails outright).
-- XPDMEventOrchestrator was confirmed correct as-is, left untouched.

UPDATE "MD_ConfigurationConstantTBL"
SET
  "configurationValue" = '["XPDMEventOrchestrator","3dx-kafka-integration"]',
  "updatedBy" = 'system',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "configurationKey" IN (
  'ClientMachineDefaultServices:vmt10008847e002',
  'ClientMachineDefaultServices:vms10008847e003'
);
