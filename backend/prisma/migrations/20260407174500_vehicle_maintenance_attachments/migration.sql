-- CreateTable
CREATE TABLE "VehicleMaintenanceAttachment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "maintenanceId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VehicleMaintenanceAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceAttachment"
  ADD CONSTRAINT "VehicleMaintenanceAttachment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceAttachment"
  ADD CONSTRAINT "VehicleMaintenanceAttachment_maintenanceId_fkey"
  FOREIGN KEY ("maintenanceId") REFERENCES "VehicleMaintenance"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "VehicleMaintenanceAttachment_tenantId_maintenanceId_idx"
  ON "VehicleMaintenanceAttachment"("tenantId", "maintenanceId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceAttachment_maintenanceId_idx"
  ON "VehicleMaintenanceAttachment"("maintenanceId");
