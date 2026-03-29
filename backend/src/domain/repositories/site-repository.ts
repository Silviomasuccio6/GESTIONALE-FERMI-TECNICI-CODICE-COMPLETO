export interface SiteRepository {
  list(tenantId: string, params: { search?: string; skip: number; take: number }): Promise<{ data: unknown[]; total: number }>;
  create(tenantId: string, input: Record<string, unknown>): Promise<unknown>;
  update(tenantId: string, id: string, input: Record<string, unknown>): Promise<unknown>;
  delete(tenantId: string, id: string): Promise<void>;
}
