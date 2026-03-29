import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPlanUpdatePayload,
  canApplyPlanAndActivate,
  canApplyPlanChange,
  rollbackPlanDraft
} from "../../frontend/src/presentation/pages/platform/platform-plan-actions.ts";

test("canApplyPlanChange disables apply when selected plan matches current plan", () => {
  const canApply = canApplyPlanChange({
    busy: false,
    currentPlan: "PRO",
    nextPlan: "PRO"
  });
  assert.equal(canApply, false);
});

test("canApplyPlanAndActivate enables action when license is not ACTIVE", () => {
  const canApply = canApplyPlanAndActivate({
    busy: false,
    currentPlan: "ENTERPRISE",
    nextPlan: "ENTERPRISE",
    licenseStatus: "SUSPENDED"
  });
  assert.equal(canApply, true);
});

test("buildPlanUpdatePayload preserves license fields while applying new plan", () => {
  const payload = buildPlanUpdatePayload({
    nextPlan: "PRO",
    license: {
      plan: "STARTER",
      seats: 12,
      status: "SUSPENDED",
      expiresAt: "2027-01-01T00:00:00.000Z",
      priceMonthly: 199,
      billingCycle: "yearly"
    }
  });

  assert.deepEqual(payload, {
    plan: "PRO",
    seats: 12,
    status: "SUSPENDED",
    expiresAt: "2027-01-01T00:00:00.000Z",
    priceMonthly: 199,
    billingCycle: "yearly"
  });
});

test("rollbackPlanDraft restores current plan after API error", () => {
  const drafts = rollbackPlanDraft({ t1: "ENTERPRISE" }, "t1", "STARTER");
  assert.deepEqual(drafts, { t1: "STARTER" });
});
