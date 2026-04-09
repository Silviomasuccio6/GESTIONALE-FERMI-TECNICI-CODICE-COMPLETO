export type NotificationStoppageRow = {
  id: string;
  openedAt: Date;
  status: string;
  vehicle: { plate: string };
  site: { name: string };
  workshop: { name: string };
};

export type NotificationReminderRow = {
  id: string;
  recipient: string;
  errorMessage: string | null;
  sentAt: Date;
};

export type NotificationInvitedUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
};

export type NotificationVehicleDeadlineRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  updatedAt: Date;
  currentKm: number | null;
  maintenanceIntervalKm: number | null;
  revisionDueAt: Date | null;
  site: { name: string };
  maintenances: Array<{ performedAt: Date; kmAtService: number | null }>;
};

export interface NotificationsRepository {
  listOpenStoppages(tenantId: string, take: number): Promise<NotificationStoppageRow[]>;
  listFailedReminders(tenantId: string, take: number): Promise<NotificationReminderRow[]>;
  listInvitedUsers(tenantId: string, take: number): Promise<NotificationInvitedUserRow[]>;
  listVehicleDeadlineCandidates(tenantId: string, take: number): Promise<NotificationVehicleDeadlineRow[]>;
}
