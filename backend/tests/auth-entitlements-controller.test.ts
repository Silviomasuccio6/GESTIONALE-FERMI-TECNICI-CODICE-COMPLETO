import assert from "node:assert/strict";
import test from "node:test";
import { AuthController } from "../src/interfaces/http/controllers/auth-controller.js";

test("auth controller exposes /me/entitlements payload", async () => {
  const controller = new AuthController(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {
      getTenantEntitlements: async () => ({
        plan: "PRO",
        priceMonthly: 149,
        features: ["reports_basic", "reports_advanced"],
        license: {
          plan: "PRO",
          seats: 5,
          status: "ACTIVE",
          expiresAt: null,
          daysRemaining: null,
          expiringSoon: false,
          priceMonthly: null,
          billingCycle: "monthly"
        }
      })
    } as any,
    {} as any,
    {} as any
  );

  let jsonPayload: any;
  await controller.entitlements(
    {
      auth: { tenantId: "tenant-1" }
    } as any,
    {
      json: (payload: unknown) => {
        jsonPayload = payload;
      }
    } as any
  );

  assert.equal(jsonPayload.plan, "PRO");
  assert.equal(jsonPayload.priceMonthly, 149);
  assert.deepEqual(jsonPayload.features, ["reports_basic", "reports_advanced"]);
});
