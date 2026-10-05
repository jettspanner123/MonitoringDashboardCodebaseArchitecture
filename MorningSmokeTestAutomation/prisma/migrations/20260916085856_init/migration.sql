-- CreateTable
CREATE TABLE "MD_TestRunTBL" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MD_TestRunTBL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MD_AuthenticationPingCheckTBL" (
    "id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,

    CONSTRAINT "MD_AuthenticationPingCheckTBL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MD_AuthenticationLoginCheckTBL" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,

    CONSTRAINT "MD_AuthenticationLoginCheckTBL_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MD_AuthenticationPingCheckTBL" ADD CONSTRAINT "MD_AuthenticationPingCheckTBL_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "MD_TestRunTBL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MD_AuthenticationLoginCheckTBL" ADD CONSTRAINT "MD_AuthenticationLoginCheckTBL_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "MD_TestRunTBL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
