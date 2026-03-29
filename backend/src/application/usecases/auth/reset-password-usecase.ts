import bcrypt from "bcryptjs";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { hashToken } from "../../../infrastructure/email/email-queue-service.js";

export class ResetPasswordUseCase {
  async execute(input: { token: string; newPassword: string }) {
    const tokenHash = hashToken(input.token);

    const record = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!record) throw new AppError("Token reset non valido o scaduto", 400, "INVALID_TOKEN");

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash, status: "ACTIVE" } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    ]);

    return { success: true };
  }
}
