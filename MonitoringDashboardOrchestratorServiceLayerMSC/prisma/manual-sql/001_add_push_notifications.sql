-- Applied by hand via `prisma db execute`, NOT `prisma migrate` - this
-- backend shares its database with MorningSmokeTestAutomation's own tracked
-- Prisma migration history, so running `prisma migrate` here would collide
-- with it. These two tables are the exception to this backend's normal
-- read-only/schema-mirroring rule - see prisma/schema.prisma's header
-- comment. Mirrors the two new models added there (PushSubscription,
-- NotificationCheckpoint) column-for-column.

CREATE TABLE "MD_PushSubscriptionTBL" (
  "id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dhKey" TEXT NOT NULL,
  "authKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MD_PushSubscriptionTBL_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MD_PushSubscriptionTBL_endpoint_key" ON "MD_PushSubscriptionTBL"("endpoint");

CREATE TABLE "MD_NotificationCheckpointTBL" (
  "id" INTEGER NOT NULL,
  "lastNotifiedRunId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MD_NotificationCheckpointTBL_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MD_NotificationCheckpointTBL" ("id", "lastNotifiedRunId", "updatedAt")
VALUES (1, NULL, CURRENT_TIMESTAMP);
