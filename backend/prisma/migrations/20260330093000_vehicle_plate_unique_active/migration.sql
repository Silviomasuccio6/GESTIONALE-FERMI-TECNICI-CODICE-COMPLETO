DROP INDEX IF EXISTS "Vehicle_tenantId_plate_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_tenantId_plate_active_key"
ON "Vehicle" ("tenantId", "plate")
WHERE "deletedAt" IS NULL;
