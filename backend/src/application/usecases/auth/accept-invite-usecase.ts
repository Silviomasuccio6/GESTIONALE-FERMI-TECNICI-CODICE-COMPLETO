import bcrypt from "bcryptjs";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { hashToken } from "../../../infrastructure/email/email-queue-service.js";

export class AcceptInviteUseCase {
  async execute(input: { token: string; password: string; firstName?: string; lastName?: string }) {
    const tokenHash = hashToken(input.token);

    const invite = await prisma.invitationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!invite) throw new AppError("Invito non valido o scaduto", 400, "INVALID_INVITE");

    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: invite.userId },
        data: {
          passwordHash,
          status: "ACTIVE",
          ...(input.firstName ? { firstName: input.firstName } : {}),
          ...(input.lastName ? { lastName: input.lastName } : {})
        }
      }),
      prisma.invitationToken.update({ where: { id: invite.id }, data: { usedAt: new Date() } })
    ]);

    return { success: true, email: invite.user.email };
  }
}
