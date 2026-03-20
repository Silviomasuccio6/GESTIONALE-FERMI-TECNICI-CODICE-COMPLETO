export type AuditLogRow = {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: unknown;
  createdAt: Date;
};

export interface AuditLogRepository {
  countByTenant(tenantId: string): Promise<number>;
  listByTenant(tenantId: string, input: { skip: number; take: number }): Promise<AuditLogRow[]>;
  listLatestByTenant(tenantId: string, take: number): Promise<AuditLogRow[]>;
  getLatestByAction(tenantId: string, resource: string, action: string): Promise<AuditLogRow | null>;
  create(input: {
    tenantId: string;
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: unknown;
  }): Promise<void>;
}
