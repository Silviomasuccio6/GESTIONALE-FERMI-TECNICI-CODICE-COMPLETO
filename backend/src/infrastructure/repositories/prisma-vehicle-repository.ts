import { VehicleRepository } from "../../domain/repositories/vehicle-repository.js";
import { prisma } from "../database/prisma/client.js";

export class PrismaVehicleRepository implements VehicleRepository {
  async list(tenantId: string, params: { search?: string; skip: number; take: number }) {
    const where = {
      tenantId,
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { plate: { contains: params.search, mode: "insensitive" as const } },
              { brand: { contains: params.search, mode: "insensitive" as const } },
              { model: { contains: params.search, mode: "insensitive" as const } },
              { site: { name: { contains: params.search, mode: "insensitive" as const } } },
              { site: { city: { contains: params.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [total, data] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: { site: true, photos: true, booklet: true }
      })
    ]);

    return { data, total };
  }

  findByPlate(tenantId: string, plate: string) {
    return prisma.vehicle.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        plate: { equals: plate, mode: "insensitive" }
      },
      include: { site: true, photos: true, booklet: true }
    });
  }

  findById(tenantId: string, id: string) {
    return prisma.vehicle.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { site: true, photos: true, booklet: true }
    });
  }

  create(tenantId: string, input: Record<string, unknown>) {
    return prisma.vehicle.create({ data: { tenantId, ...input } as never });
  }

  async update(tenantId: string, id: string, input: Record<string, unknown>) {
    await prisma.vehicle.updateMany({ where: { id, tenantId, deletedAt: null }, data: input as never });
    return prisma.vehicle.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { site: true, photos: true, booklet: true }
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.vehicle.updateMany({ where: { id, tenantId, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}
