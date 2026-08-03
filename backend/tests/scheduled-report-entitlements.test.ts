import assert from "node:assert/strict";
import test from "node:test";
import { canRunScheduledReport } from "../src/infrastructure/cron/reports-cron.js";

const scheduledAtEight = {
  enabled: true,
  frequency: "daily",
  hour: 8,
  minute: 0
};

test("downgraded Starter tenants do not receive previously configured scheduled reports", () => {
  const runAt = new Date(2026, 7, 3, 8, 0, 0);
  assert.equal(canRunScheduledReport("STARTER", scheduledAtEight, runAt), false);
  assert.equal(canRunScheduledReport("PRO", scheduledAtEight, runAt), true);
  assert.equal(canRunScheduledReport("ENTERPRISE", scheduledAtEight, runAt), true);
});

test("disabled or mistimed report schedules do not run for entitled tenants", () => {
  assert.equal(canRunScheduledReport("PRO", { ...scheduledAtEight, enabled: false }, new Date(2026, 7, 3, 8, 0, 0)), false);
  assert.equal(canRunScheduledReport("PRO", scheduledAtEight, new Date(2026, 7, 3, 8, 1, 0)), false);
});
