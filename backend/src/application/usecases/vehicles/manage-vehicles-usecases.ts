import { PrismaVehicleRepository } from "../../../infrastructure/repositories/prisma-vehicle-repository.js";
import { computeVehicleRevisionDueAt } from "../../services/vehicle-revision-schedule-service.js";
import { AppError } from "../../../shared/errors/app-error.js";

export class ManageVehiclesUseCases {
  constructor(private readonly repository: PrismaVehicleRepository) {}
  list(tenantId: string, params: { search?: string; skip: number; take: number }) { return this.repository.list(tenantId, params); }

  private normalizePlate(input: Record<string, unknown>) {
    const plate = String(input.plate ?? "").trim().toUpperCase();
    return plate ? { ...input, plate } : input;
  }

  private asDateOrNull(value: unknown): Date | null {
    if (value === undefined || value === null || value === "") return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private applyAutomaticRevisionCycle(input: Record<string, unknown>, fallback?: Record<string, unknown>): Record<string, unknown> {
    const registrationDateRaw =
      input.registrationDate !== undefined ? input.registrationDate : fallback?.registrationDate;
    const lastRevisionAtRaw = input.lastRevisionAt !== undefined ? input.lastRevisionAt : fallback?.lastRevisionAt;
    const manualRevisionDueAtRaw =
      input.revisionDueAt !== undefined ? input.revisionDueAt : fallback?.revisionDueAt;

    const registrationDate = this.asDateOrNull(registrationDateRaw);
    const lastRevisionAt = this.asDateOrNull(lastRevisionAtRaw);
    const manualRevisionDueAt = this.asDateOrNull(manualRevisionDueAtRaw);

    return {
      ...input,
      revisionDueAt: computeVehicleRevisionDueAt({
        registrationDate,
        lastRevisionAt,
        manualRevisionDueAt
      })
    } as Record<string, unknown>;
  }

  async create(tenantId: string, input: Record<string, unknown>) {
    const normalizedInput = this.applyAutomaticRevisionCycle(this.normalizePlate(input));
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
    const existing = (await this.repository.findById(tenantId, id)) as Record<string, unknown> | null;
    if (!existing) throw new AppError("Veicolo non trovato", 404, "NOT_FOUND");

    const normalizedInput = this.applyAutomaticRevisionCycle(this.normalizePlate(input), existing);
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
