-- AlterTable
ALTER TABLE "Vehicle"
ADD COLUMN "registrationDate" TIMESTAMP(3),
ADD COLUMN "lastRevisionAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VehicleBooklet" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "extractedRegistrationDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VehicleBooklet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBooklet_vehicleId_key" ON "VehicleBooklet"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleBooklet_tenantId_vehicleId_idx" ON "VehicleBooklet"("tenantId", "vehicleId");

-- AddForeignKey
ALTER TABLE "VehicleBooklet"
  ADD CONSTRAINT "VehicleBooklet_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleBooklet"
  ADD CONSTRAINT "VehicleBooklet_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
