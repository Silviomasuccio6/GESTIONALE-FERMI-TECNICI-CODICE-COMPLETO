export type StoppageStatus = "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "SOLICITED" | "CLOSED" | "CANCELED";

export type StoppageEntity = {
  id: string;
  tenantId: string;
  siteId: string;
  vehicleId: string;
  workshopId: string;
  createdByUserId: string;
  reason: string;
  notes?: string | null;
  status: StoppageStatus;
  openedAt: Date;
  closedAt?: Date | null;
  reminderAfterDays?: number | null;
  totalRemindersSent: number;
};
