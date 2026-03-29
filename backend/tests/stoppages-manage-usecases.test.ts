import assert from "node:assert/strict";
import test from "node:test";
import { ManageStoppagesUseCases } from "../src/application/usecases/stoppages/manage-stoppages-usecases.js";

test("update CLOSED without closure summary still sets closedAt", async () => {
  let captured: Record<string, unknown> | null = null;

  const repository = {
    update: async (_tenantId: string, _id: string, input: Record<string, unknown>) => {
      captured = input;
      return { id: "st-1", ...input };
    }
  } as any;

  const useCases = new ManageStoppagesUseCases(repository);
  await useCases.update("tenant-1", "st-1", { status: "CLOSED" });

  assert.ok(captured);
  assert.equal(captured?.status, "CLOSED");
  assert.ok(captured?.closedAt instanceof Date);
});

test("update CLOSED keeps provided closedAt and does not overwrite other fields", async () => {
  let captured: Record<string, unknown> | null = null;

  const existingClosedAt = new Date("2026-03-01T10:00:00.000Z");

  const repository = {
    update: async (_tenantId: string, _id: string, input: Record<string, unknown>) => {
      captured = input;
      return { id: "st-2", ...input };
    }
  } as any;

  const useCases = new ManageStoppagesUseCases(repository);
  await useCases.update("tenant-1", "st-2", {
    status: "CLOSED",
    closedAt: existingClosedAt,
    notes: "chiuso in giornata"
  });

  assert.ok(captured);
  assert.equal(captured?.status, "CLOSED");
  assert.equal(captured?.closedAt, existingClosedAt);
  assert.equal(captured?.notes, "chiuso in giornata");
});
