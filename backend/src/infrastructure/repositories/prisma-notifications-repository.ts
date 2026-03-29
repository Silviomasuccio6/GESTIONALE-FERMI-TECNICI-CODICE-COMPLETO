import {
  NotificationInvitedUserRow,
  NotificationReminderRow,
  NotificationsRepository,
  NotificationStoppageRow
} from "../../domain/repositories/notifications-repository.js";
import { prisma } from "../database/prisma/client.js";

export class PrismaNotificationsRepository implements NotificationsRepository {
  async listOpenStoppages(tenantId: string, take: number): Promise<NotificationStoppageRow[]> {
    return prisma.stoppage.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED"] }
      },
      include: { vehicle: { select: { plate: true } }, site: { select: { name: true } }, workshop: { select: { name: true } } },
      orderBy: { openedAt: "asc" },
      take
    }) as unknown as NotificationStoppageRow[];
  }

  async listFailedReminders(tenantId: string, take: number): Promise<NotificationReminderRow[]> {
    return prisma.reminder.findMany({
      where: { tenantId, success: false },
      orderBy: { sentAt: "desc" },
      take,
      select: { id: true, recipient: true, errorMessage: true, sentAt: true }
    }) as unknown as NotificationReminderRow[];
  }

  async listInvitedUsers(tenantId: string, take: number): Promise<NotificationInvitedUserRow[]> {
    return prisma.user.findMany({
      where: { tenantId, status: "INVITED", deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take
    }) as unknown as NotificationInvitedUserRow[];
  }
}
