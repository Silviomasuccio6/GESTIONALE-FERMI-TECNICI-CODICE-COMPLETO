import { ReminderRepository } from "../../domain/repositories/reminder-repository.js";
import { prisma } from "../database/prisma/client.js";

export class PrismaReminderRepository implements ReminderRepository {
  async create(input: {
    tenantId: string;
    stoppageId: string;
    type: string;
    channel: "EMAIL" | "WHATSAPP";
    recipient: string;
    subject?: string;
    body: string;
    success?: boolean;
    errorMessage?: string;
  }) {
    await prisma.reminder.create({ data: { ...input, success: input.success ?? true } });
  }
}
