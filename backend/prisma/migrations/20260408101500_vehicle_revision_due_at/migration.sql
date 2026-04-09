-- AlterTable
ALTER TABLE "Vehicle"
ADD COLUMN "revisionDueAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_revisionDueAt_idx"
ON "Vehicle"("tenantId", "revisionDueAt");
