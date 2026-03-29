import crypto from "node:crypto";
import { AuditLogRepository, AuditLogRow } from "../../domain/repositories/audit-log-repository.js";
import { prisma } from "../database/prisma/client.js";

export class PrismaAuditLogRepository implements AuditLogRepository {
  async countByTenant(tenantId: string): Promise<number> {
    return prisma.auditLog.count({ where: { tenantId } });
  }

  async listByTenant(tenantId: string, input: { skip: number; take: number }): Promise<AuditLogRow[]> {
    return prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: input.skip,
      take: input.take
    });
  }

  async listLatestByTenant(tenantId: string, take: number): Promise<AuditLogRow[]> {
    return prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take
    });
  }

  async getLatestByAction(tenantId: string, resource: string, action: string): Promise<AuditLogRow | null> {
    return prisma.auditLog.findFirst({
      where: { tenantId, resource, action },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(input: {
    tenantId: string;
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: unknown;
  }): Promise<void> {
    const previous = await prisma.auditLog.findFirst({
      where: { tenantId: input.tenantId },
      orderBy: { createdAt: "desc" },
      select: { id: true, details: true, createdAt: true }
    });
    const prevHash = (previous?.details as any)?.__meta?.hash ?? null;
    const canonical = JSON.stringify({
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      details: input.details ?? null,
      prevHash
    });
    const hash = crypto.createHash("sha256").update(canonical).digest("hex");

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        details: ({
          ...(typeof input.details === "object" && input.details !== null ? (input.details as object) : { value: input.details ?? null }),
          __meta: { immutable: true, hash, prevHash, ts: new Date().toISOString() }
        } as any)
      }
    });
  }
}
