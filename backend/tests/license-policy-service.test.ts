import assert from "node:assert/strict";
import test from "node:test";
import { LicensePolicyService } from "../src/application/services/license-policy-service.js";
import { AuditLogRepository, AuditLogRow } from "../src/domain/repositories/audit-log-repository.js";

class FakeAuditRepo implements AuditLogRepository {
  public latest: AuditLogRow | null = null;

  async countByTenant(_tenantId: string): Promise<number> {
    return 0;
  }

  async listByTenant(_tenantId: string, _input: { skip: number; take: number }): Promise<AuditLogRow[]> {
    return [];
  }

  async listLatestByTenant(_tenantId: string, _take: number): Promise<AuditLogRow[]> {
    return [];
  }

  async getLatestByAction(_tenantId: string, _resource: string, _action: string): Promise<AuditLogRow | null> {
    return this.latest;
  }

  async create(_input: {
    tenantId: string;
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: unknown;
  }): Promise<void> {}
}

test("license policy reads plan from nested details.after payload", async () => {
  const repo = new FakeAuditRepo();
  repo.latest = {
    id: "audit-1",
    tenantId: "tenant-1",
    userId: "platform-admin",
    action: "PLATFORM_LICENSE_UPDATED",
    resource: "tenant",
    resourceId: "tenant-1",
    details: {
      actor: "platform-admin",
      before: { plan: "STARTER" },
      after: {
        plan: "PRO",
        seats: 5,
        status: "ACTIVE",
        expiresAt: null,
        priceMonthly: 149,
        billingCycle: "monthly"
      }
    },
    createdAt: new Date()
  };

  const service = new LicensePolicyService(repo);
  const entitlements = await service.getTenantEntitlements("tenant-1");

  assert.equal(entitlements.plan, "PRO");
  assert.equal(entitlements.license.plan, "PRO");
  assert.equal(entitlements.priceMonthly, 149);
});

test("license policy reads plan from raw payload for backward compatibility", async () => {
  const repo = new FakeAuditRepo();
  repo.latest = {
    id: "audit-2",
    tenantId: "tenant-2",
    userId: "platform-admin",
    action: "PLATFORM_LICENSE_UPDATED",
    resource: "tenant",
    resourceId: "tenant-2",
    details: {
      plan: "ENTERPRISE",
      seats: 10,
      status: "ACTIVE",
      expiresAt: null,
      priceMonthly: 399,
      billingCycle: "yearly"
    },
    createdAt: new Date()
  };

  const service = new LicensePolicyService(repo);
  const license = await service.getTenantLicense("tenant-2");

  assert.equal(license.plan, "ENTERPRISE");
  assert.equal(license.billingCycle, "yearly");
});
