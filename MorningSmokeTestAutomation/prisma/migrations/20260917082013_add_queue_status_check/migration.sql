-- CreateTable
CREATE TABLE "MD_QueueStatusCheckTBL" (
    "id" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lessThan10Min" TEXT NOT NULL,
    "lessThan1Hour" TEXT NOT NULL,
    "lessThan4Hours" TEXT NOT NULL,
    "greaterThan4Hours" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,

    CONSTRAINT "MD_QueueStatusCheckTBL_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MD_QueueStatusCheckTBL" ADD CONSTRAINT "MD_QueueStatusCheckTBL_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "MD_TestRunTBL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
