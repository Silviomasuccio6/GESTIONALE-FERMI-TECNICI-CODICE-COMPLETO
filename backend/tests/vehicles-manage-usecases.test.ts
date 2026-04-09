import assert from "node:assert/strict";
import test from "node:test";
import { ManageVehiclesUseCases } from "../src/application/usecases/vehicles/manage-vehicles-usecases.js";

const buildRepo = (overrides?: Partial<any>) => ({
  list: async () => ({ data: [], total: 0 }),
  findById: async (_tenantId: string, id: string) => ({ id, plate: "AB123CD" }),
  findByPlate: async () => null,
  create: async (_tenantId: string, input: Record<string, unknown>) => ({ id: "veh-1", ...input }),
  update: async (_tenantId: string, _id: string, input: Record<string, unknown>) => ({ id: "veh-1", ...input }),
  delete: async () => undefined,
  ...overrides
});

test("create normalizes plate to uppercase and trim", async () => {
  let captured: Record<string, unknown> | null = null;
  const repo = buildRepo({
    create: async (_tenantId: string, input: Record<string, unknown>) => {
      captured = input;
      return { id: "veh-1", ...input };
    }
  });

  const useCases = new ManageVehiclesUseCases(repo as any);
  await useCases.create("tenant-1", { siteId: "s1", plate: " ab123cd ", brand: "Iveco", model: "Daily" });

  assert.ok(captured);
  assert.equal(captured?.plate, "AB123CD");
});

test("create rejects duplicate plate with domain error code", async () => {
  const repo = buildRepo({
    findByPlate: async () => ({ id: "existing-vehicle" })
  });

  const useCases = new ManageVehiclesUseCases(repo as any);

  await assert.rejects(
    () => useCases.create("tenant-1", { siteId: "s1", plate: "AB123CD", brand: "Iveco", model: "Daily" }),
    (error: any) => {
      assert.equal(error.code, "VEHICLE_PLATE_ALREADY_EXISTS");
      assert.equal(error.statusCode, 409);
      return true;
    }
  );
});

test("update rejects duplicate plate owned by another vehicle", async () => {
  const repo = buildRepo({
    findByPlate: async () => ({ id: "veh-other" })
  });

  const useCases = new ManageVehiclesUseCases(repo as any);

  await assert.rejects(
    () => useCases.update("tenant-1", "veh-1", { plate: "AB123CD" }),
    (error: any) => {
      assert.equal(error.code, "VEHICLE_PLATE_ALREADY_EXISTS");
      assert.equal(error.statusCode, 409);
      return true;
    }
  );
});
