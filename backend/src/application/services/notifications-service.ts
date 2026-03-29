import { NotificationsRepository } from "../../domain/repositories/notifications-repository.js";
import { stoppageStatusLabel } from "../../shared/utils/stoppage-status-label.js";

export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async inbox(tenantId: string) {
    const now = new Date();
    const [openStoppages, failedReminders, invitedUsers] = await Promise.all([
      this.repository.listOpenStoppages(tenantId, 30),
      this.repository.listFailedReminders(tenantId, 20),
      this.repository.listInvitedUsers(tenantId, 20)
    ]);

    const stoppageItems = openStoppages
      .map((item) => {
        const days = Math.floor((now.getTime() - item.openedAt.getTime()) / 86400000);
        if (days < 4) return null;
        return {
          id: `stoppage-${item.id}`,
          type: "STOPPAGE_OVERDUE",
          severity: days > 15 ? "HIGH" : days > 8 ? "MEDIUM" : "LOW",
          title: `${item.vehicle.plate} fermo da ${days} giorni`,
          description: `${item.site.name} · ${item.workshop.name} · ${stoppageStatusLabel(item.status)}`,
          createdAt: item.openedAt
        };
      })
      .filter(Boolean);

    const reminderItems = failedReminders.map((item) => ({
      id: `reminder-${item.id}`,
      type: "REMINDER_FAILED",
      severity: "MEDIUM",
      title: "Reminder non inviato",
      description: `${item.recipient} · ${item.errorMessage ?? "errore sconosciuto"}`,
      createdAt: item.sentAt
    }));

    const inviteItems = invitedUsers.map((user) => ({
      id: `invite-${user.id}`,
      type: "USER_INVITED_PENDING",
      severity: "LOW",
      title: "Utente invitato non ancora attivo",
      description: `${user.firstName} ${user.lastName} · ${user.email}`,
      createdAt: user.createdAt
    }));

    return [...stoppageItems, ...reminderItems, ...inviteItems]
      .sort((a: any, b: any) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
      .slice(0, 50);
  }
}
