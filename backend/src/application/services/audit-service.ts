import { AuditLogRepository } from "../../domain/repositories/audit-log-repository.js";

export class AuditService {
  constructor(private readonly repository: AuditLogRepository) {}

  async list(tenantId: string, page: number, pageSize: number) {
    const [total, data] = await Promise.all([
      this.repository.countByTenant(tenantId),
      this.repository.listByTenant(tenantId, { skip: (page - 1) * pageSize, take: pageSize })
    ]);
    return { data, total, page, pageSize };
  }

  async exportRows(tenantId: string, take = 5000) {
    return this.repository.listLatestByTenant(tenantId, take);
  }
}
