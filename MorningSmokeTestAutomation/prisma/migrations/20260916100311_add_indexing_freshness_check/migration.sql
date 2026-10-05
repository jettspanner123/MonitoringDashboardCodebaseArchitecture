-- CreateTable
CREATE TABLE "MD_IndexingFreshnessCheckTBL" (
    "id" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL,
    "index_time" TIMESTAMP(3) NOT NULL,
    "machine_time" TIMESTAMP(3) NOT NULL,
    "time_difference" DOUBLE PRECISION NOT NULL,
    "is_fresh" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "test_run_id" TEXT NOT NULL,

    CONSTRAINT "MD_IndexingFreshnessCheckTBL_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MD_IndexingFreshnessCheckTBL" ADD CONSTRAINT "MD_IndexingFreshnessCheckTBL_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "MD_TestRunTBL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
