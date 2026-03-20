import { WorkshopRepository } from "../../domain/repositories/workshop-repository.js";
import { prisma } from "../database/prisma/client.js";

export class PrismaWorkshopRepository implements WorkshopRepository {
  async list(tenantId: string, params: { search?: string; skip: number; take: number }) {
    const where = {
      tenantId,
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { city: { contains: params.search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    const [total, data] = await Promise.all([
      prisma.workshop.count({ where }),
      prisma.workshop.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } })
    ]);

    return { data, total };
  }

  create(tenantId: string, input: Record<string, unknown>) {
    return prisma.workshop.create({ data: { tenantId, ...input } as never });
  }

  async update(tenantId: string, id: string, input: Record<string, unknown>) {
    await prisma.workshop.updateMany({ where: { id, tenantId, deletedAt: null }, data: input as never });
    return prisma.workshop.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.workshop.updateMany({ where: { id, tenantId, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}
