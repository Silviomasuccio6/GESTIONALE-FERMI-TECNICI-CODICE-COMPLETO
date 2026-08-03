import assert from "node:assert/strict";
import test from "node:test";
import { getFeatureListForPlan, hasFeature } from "../src/domain/constants/entitlements";
import {
  filterFeatureVisibleItems,
  getRequiredFeatureForAppPath
} from "../src/domain/policies/feature-visibility";

test("commercial features are cumulative across Starter, Pro and Enterprise", () => {
  assert.equal(getFeatureListForPlan("STARTER").length, 8);
  assert.equal(getFeatureListForPlan("PRO").length, 16);
  assert.equal(getFeatureListForPlan("ENTERPRISE").length, 26);
  assert.deepEqual(getFeatureListForPlan("UNKNOWN"), getFeatureListForPlan("STARTER"));

  assert.equal(hasFeature("STARTER", "reports_basic"), true);
  assert.equal(hasFeature("STARTER", "reports_advanced"), false);
  assert.equal(hasFeature("PRO", "reports_basic"), true);
  assert.equal(hasFeature("PRO", "reports_advanced"), true);
  assert.equal(hasFeature("PRO", "webhooks"), false);
  assert.equal(hasFeature("ENTERPRISE", "reports_advanced"), true);
  assert.equal(hasFeature("ENTERPRISE", "webhooks"), true);
});

test("operational navigation removes unavailable features instead of showing locks", () => {
  const items = [
    { key: "dashboard" },
    { key: "stats", feature: "reports_advanced" as const },
    {
      key: "settings",
      children: [
        { key: "base" },
        { key: "webhooks", feature: "webhooks" as const }
      ]
    }
  ];

  const starterItems = filterFeatureVisibleItems(items, true, (feature) => hasFeature("STARTER", feature));
  assert.deepEqual(starterItems.map((item) => item.key), ["dashboard", "settings"]);
  assert.deepEqual(starterItems[1]?.children?.map((item) => item.key), ["base"]);

  const enterpriseItems = filterFeatureVisibleItems(items, true, (feature) => hasFeature("ENTERPRISE", feature));
  assert.deepEqual(enterpriseItems.map((item) => item.key), ["dashboard", "stats", "settings"]);
  assert.deepEqual(enterpriseItems[2]?.children?.map((item) => item.key), ["base", "webhooks"]);

  const loadingItems = filterFeatureVisibleItems(items, false, () => true);
  assert.deepEqual(loadingItems.map((item) => item.key), ["dashboard", "settings"]);
  assert.deepEqual(loadingItems[1]?.children?.map((item) => item.key), ["base"]);
});

test("direct premium routes are mapped to their required feature", () => {
  assert.equal(getRequiredFeatureForAppPath("/statistiche"), "reports_advanced");
  assert.equal(getRequiredFeatureForAppPath("/statistiche/veicoli"), "reports_advanced");
  assert.equal(getRequiredFeatureForAppPath("/upgrade"), null);
  assert.equal(getRequiredFeatureForAppPath("/dashboard"), null);
});
