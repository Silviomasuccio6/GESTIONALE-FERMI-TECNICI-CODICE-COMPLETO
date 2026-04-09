export interface VehicleRepository {
  list(tenantId: string, params: { search?: string; skip: number; take: number }): Promise<{ data: unknown[]; total: number }>;
  findById(tenantId: string, id: string): Promise<unknown | null>;
  findByPlate(tenantId: string, plate: string): Promise<unknown | null>;
  create(tenantId: string, input: Record<string, unknown>): Promise<unknown>;
  update(tenantId: string, id: string, input: Record<string, unknown>): Promise<unknown>;
  delete(tenantId: string, id: string): Promise<void>;
}
