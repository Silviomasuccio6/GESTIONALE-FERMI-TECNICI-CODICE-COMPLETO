import { PrismaStoppageRepository } from "../../../infrastructure/repositories/prisma-stoppage-repository.js";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";

export class ManageStoppagesUseCases {
  constructor(private readonly repository: PrismaStoppageRepository) {}
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
    return this.repository.create(tenantId, input);
  }
  async update(tenantId: string, id: string, input: Record<string, unknown>) {
    if (input.status === "CLOSED" && !input.closedAt) {
      input.closedAt = new Date();
    }
    return this.repository.update(tenantId, id, input);
  }
  delete(tenantId: string, id: string) { return this.repository.delete(tenantId, id); }
}
