import assert from "node:assert/strict";
import test from "node:test";
import { FeatureKey } from "../src/application/services/feature-entitlements-service.js";
import { auditRoutes } from "../src/interfaces/http/routes/audit-routes.js";
import { masterDataRoutes } from "../src/interfaces/http/routes/master-data-routes.js";
import { settingsRoutes } from "../src/interfaces/http/routes/settings-routes.js";

const noOpController = new Proxy(
  {},
  {
    get: () => async () => undefined
  }
);

const captureFeatures = (buildRouter: (requireFeature: (feature: FeatureKey) => any) => unknown) => {
  const features: FeatureKey[] = [];
  buildRouter((feature) => {
    features.push(feature);
    return (_req: unknown, _res: unknown, next: () => void) => next();
  });
  return features;
};

test("settings routes enforce scheduled reports and Enterprise webhooks", () => {
  const features = captureFeatures((requireFeature) => settingsRoutes(noOpController as any, requireFeature));
  assert.deepEqual(features, ["scheduled_reports", "scheduled_reports", "webhooks", "webhooks"]);
});

test("maintenance exports enforce the Pro export entitlement", () => {
  const features = captureFeatures((requireFeature) => masterDataRoutes(noOpController as any, requireFeature));
  assert.deepEqual(features, ["export_csv", "export_csv"]);
});

test("audit list and export use standard and advanced audit entitlements", () => {
  const features = captureFeatures((requireFeature) => auditRoutes(noOpController as any, requireFeature));
  assert.deepEqual(features, ["audit_standard", "audit_advanced"]);
});
