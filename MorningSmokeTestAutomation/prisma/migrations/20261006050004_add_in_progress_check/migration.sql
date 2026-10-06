-- CreateTable
CREATE TABLE "MD_InProgressCheckTBL" (
    "id" TEXT NOT NULL,
    "checkName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,

    CONSTRAINT "MD_InProgressCheckTBL_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MD_InProgressCheckTBL_testRunId_checkName_key" ON "MD_InProgressCheckTBL"("testRunId", "checkName");

-- AddForeignKey
ALTER TABLE "MD_InProgressCheckTBL" ADD CONSTRAINT "MD_InProgressCheckTBL_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "MD_TestRunTBL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
