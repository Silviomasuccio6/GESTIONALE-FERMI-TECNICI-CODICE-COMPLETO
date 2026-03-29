export type StoppageEventRow = {
  id: string;
  createdAt: Date;
  payload: unknown;
};

export interface StoppageOpsRepository {
  createEvent(input: {
    tenantId: string;
    stoppageId: string;
    userId?: string;
    type: string;
    message: string;
    payload?: unknown;
  }): Promise<void>;
  listEvents(tenantId: string, stoppageId: string, take: number): Promise<StoppageEventRow[]>;
  listEventsByType(tenantId: string, stoppageId: string, type: string): Promise<StoppageEventRow[]>;
  findLatestEventByType(tenantId: string, stoppageId: string, type: string): Promise<StoppageEventRow | null>;
  listActiveUsers(tenantId: string): Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>>;
  listOpenStoppagesForAssignment(
    tenantId: string
  ): Promise<Array<{ id: string; assignedToUserId: string | null; priority: string }>>;
  listCalendarRows(
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<
    Array<{
      id: string;
      openedAt: Date;
      closedAt: Date | null;
      status: string;
      priority: string;
      vehicle: { plate: string };
      site: { name: string };
      workshop: { name: string };
    }>
  >;
  listCostRows(
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<
    Array<{
      openedAt: Date;
      closedAt: Date | null;
      estimatedCostPerDay: number | null;
      site: { name: string };
      workshop: { name: string };
    }>
  >;
}
