import { PrismaWorkshopRepository } from "../../../infrastructure/repositories/prisma-workshop-repository.js";

export class ManageWorkshopsUseCases {
  constructor(private readonly repository: PrismaWorkshopRepository) {}
  list(tenantId: string, params: { search?: string; skip: number; take: number }) { return this.repository.list(tenantId, params); }
  create(tenantId: string, input: Record<string, unknown>) { return this.repository.create(tenantId, input); }
  update(tenantId: string, id: string, input: Record<string, unknown>) { return this.repository.update(tenantId, id, input); }
  delete(tenantId: string, id: string) { return this.repository.delete(tenantId, id); }
}
