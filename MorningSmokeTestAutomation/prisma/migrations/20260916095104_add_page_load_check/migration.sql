-- CreateTable
CREATE TABLE "MD_PageLoadCheckTBL" (
    "id" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,

    CONSTRAINT "MD_PageLoadCheckTBL_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MD_PageLoadCheckTBL" ADD CONSTRAINT "MD_PageLoadCheckTBL_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "MD_TestRunTBL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
