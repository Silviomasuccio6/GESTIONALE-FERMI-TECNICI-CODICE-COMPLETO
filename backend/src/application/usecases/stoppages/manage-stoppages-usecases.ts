import { PrismaStoppageRepository } from "../../../infrastructure/repositories/prisma-stoppage-repository.js";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";

export class ManageStoppagesUseCases {
  constructor(private readonly repository: PrismaStoppageRepository) {}

  private normalizeWorkflowFields(current: Record<string, unknown> | null, input: Record<string, unknown>) {
    const nextAssignedRaw = input.assignedToUserId ?? current?.assignedToUserId ?? null;
    const nextAssignedToUserId = nextAssignedRaw ? String(nextAssignedRaw).trim() : null;

    const parsedReminder =
      input.reminderAfterDays !== undefined
        ? Number(input.reminderAfterDays)
        : current?.reminderAfterDays !== undefined && current?.reminderAfterDays !== null
          ? Number(current.reminderAfterDays)
          : null;

    const nextReminderAfterDays = Number.isFinite(parsedReminder as number) && Number(parsedReminder) > 0 ? Math.max(1, Math.trunc(Number(parsedReminder))) : null;

    return { assignedToUserId: nextAssignedToUserId, reminderAfterDays: nextReminderAfterDays };
  }

  list(
    tenantId: string,
    params: {
      search?: string;
      status?: string;
      siteId?: string;
      workshopId?: string;
      skip: number;
      take: number;
      sortBy?: string;
      sortDir?: "asc" | "desc";
    }
  ) {
    return this.repository.list(tenantId, params);
  }
  getById(tenantId: string, id: string) { return this.repository.getById(tenantId, id); }
  async create(tenantId: string, input: Record<string, unknown>) {
    const vehicleId = String(input.vehicleId ?? "");
    const reason = String(input.reason ?? "").trim();
    const duplicateOpen = await prisma.stoppage.findFirst({
      where: {
        tenantId,
        vehicleId,
        reason: { equals: reason, mode: "insensitive" },
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED"] },
        deletedAt: null
      }
    });
    if (duplicateOpen) throw new AppError("Esiste gia un fermo aperto simile per questo veicolo", 409, "CONFLICT");

    const workflowPatch = this.normalizeWorkflowFields(null, input);
    const payload: Record<string, unknown> = {
      ...input,
      ...workflowPatch
    };

    if (payload.status === "CLOSED" && !payload.closedAt) {
      payload.closedAt = new Date();
    }
    return this.repository.create(tenantId, payload);
  }
  async update(tenantId: string, id: string, input: Record<string, unknown>) {
    const current = (await this.repository.getById(tenantId, id)) as Record<string, unknown> | null;
    if (!current) throw new AppError("Fermo non trovato", 404, "NOT_FOUND");

    const workflowPatch = this.normalizeWorkflowFields(current, input);
    const payload: Record<string, unknown> = {
      ...input,
      ...workflowPatch
    };

    if (input.status === "CLOSED" && !input.closedAt) {
      payload.closedAt = new Date();
    } else if (input.status && input.status !== "CLOSED" && current.status === "CLOSED" && input.closedAt === undefined) {
      payload.closedAt = null;
    }
    return this.repository.update(tenantId, id, payload);
  }
  delete(tenantId: string, id: string) { return this.repository.delete(tenantId, id); }
}
