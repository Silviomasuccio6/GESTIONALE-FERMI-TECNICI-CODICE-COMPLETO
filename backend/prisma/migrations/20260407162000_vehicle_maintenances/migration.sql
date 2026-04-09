-- CreateTable
CREATE TABLE "VehicleMaintenance" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL,
  "maintenanceType" TEXT NOT NULL,
  "description" TEXT,
  "workshopName" TEXT,
  "kmAtService" INTEGER,
  "cost" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "VehicleMaintenance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleMaintenance"
  ADD CONSTRAINT "VehicleMaintenance_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenance"
  ADD CONSTRAINT "VehicleMaintenance_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "VehicleMaintenance_tenantId_vehicleId_idx"
  ON "VehicleMaintenance"("tenantId", "vehicleId");

-- CreateIndex
CREATE INDEX "VehicleMaintenance_tenantId_performedAt_idx"
  ON "VehicleMaintenance"("tenantId", "performedAt");
