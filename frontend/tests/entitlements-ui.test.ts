import assert from "node:assert/strict";
import test from "node:test";
import { getRequiredPlanForFeature, hasFeature } from "../src/domain/constants/entitlements";

test("ui gating matrix covers PRO and ENTERPRISE features", () => {
  assert.equal(hasFeature("STARTER", "export_csv"), false);
  assert.equal(hasFeature("PRO", "export_csv"), true);
  assert.equal(hasFeature("PRO", "security_insights"), false);
  assert.equal(hasFeature("ENTERPRISE", "security_insights"), true);
  assert.equal(getRequiredPlanForFeature("export_csv"), "PRO");
  assert.equal(getRequiredPlanForFeature("security_insights"), "ENTERPRISE");
});
