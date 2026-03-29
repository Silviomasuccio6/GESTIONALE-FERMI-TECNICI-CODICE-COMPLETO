import { prisma } from "../database/prisma/client.js";

export class PrismaAuthRepository {
  findLoginCandidatesByEmail(email: string) {
    return prisma.user.findMany({
      where: { email, deletedAt: null },
      select: { id: true, passwordHash: true, status: true }
    });
  }

  findUserByEmailGlobal(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findUsersByEmailGlobal(email: string) {
    return prisma.user.findMany({ where: { email, deletedAt: null } });
  }

  createTenant(name: string) {
    return prisma.tenant.create({ data: { name } });
  }

  createInvitationToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.invitationToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  findValidInvitationToken(tokenHash: string) {
    return prisma.invitationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });
  }

  activateUserByInvitation(
    invitationId: string,
    userId: string,
    passwordHash: string,
    firstName?: string,
    lastName?: string
  ) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          status: "ACTIVE",
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {})
        }
      }),
      prisma.invitationToken.update({ where: { id: invitationId }, data: { usedAt: new Date() } })
    ]);
  }

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  findValidPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true }
    });
  }

  consumePasswordResetToken(recordId: string, userId: string, passwordHash: string) {
    return prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash, status: "ACTIVE" } }),
      prisma.passwordResetToken.update({ where: { id: recordId }, data: { usedAt: new Date() } })
    ]);
  }

  findUserPasswordHash(tenantId: string, userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { passwordHash: true }
    });
  }

  updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
