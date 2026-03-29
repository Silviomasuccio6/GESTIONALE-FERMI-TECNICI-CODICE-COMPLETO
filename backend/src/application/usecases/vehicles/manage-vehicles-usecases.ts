import { PrismaVehicleRepository } from "../../../infrastructure/repositories/prisma-vehicle-repository.js";
import { AppError } from "../../../shared/errors/app-error.js";

export class ManageVehiclesUseCases {
  constructor(private readonly repository: PrismaVehicleRepository) {}
  list(tenantId: string, params: { search?: string; skip: number; take: number }) { return this.repository.list(tenantId, params); }

  private normalizePlate(input: Record<string, unknown>) {
    const plate = String(input.plate ?? "").trim().toUpperCase();
    return plate ? { ...input, plate } : input;
  }

  async create(tenantId: string, input: Record<string, unknown>) {
    const normalizedInput = this.normalizePlate(input);
    const plate = String(normalizedInput.plate ?? "");
    if (plate) {
      const existing = (await this.repository.findByPlate(tenantId, plate)) as any;
      if (existing) {
        throw new AppError("Esiste gia un veicolo con questa targa", 409, "VEHICLE_PLATE_ALREADY_EXISTS", {
          vehicleId: existing.id,
          plate
        });
      }
    }
    return this.repository.create(tenantId, normalizedInput);
  }

  async update(tenantId: string, id: string, input: Record<string, unknown>) {
    const normalizedInput = this.normalizePlate(input);
    const plate = String(normalizedInput.plate ?? "");
    if (plate) {
      const existing = (await this.repository.findByPlate(tenantId, plate)) as any;
      if (existing && String(existing.id) !== String(id)) {
        throw new AppError("Esiste gia un veicolo con questa targa", 409, "VEHICLE_PLATE_ALREADY_EXISTS", {
          vehicleId: existing.id,
          plate
        });
      }
    }
    return this.repository.update(tenantId, id, normalizedInput);
  }

  delete(tenantId: string, id: string) { return this.repository.delete(tenantId, id); }
}
