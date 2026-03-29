import bcrypt from "bcryptjs";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { PrismaUserRepository } from "../../../infrastructure/repositories/prisma-user-repository.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { AuthSessionService } from "../../services/auth-session-service.js";

export class ManageProfileUseCase {
  constructor(private readonly userRepository: PrismaUserRepository, private readonly authSessionService: AuthSessionService) {}

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("Utente non trovato", 404, "NOT_FOUND");
    return user;
  }

  async updateProfile(tenantId: string, userId: string, input: { firstName: string; lastName: string }) {
    const user = await this.userRepository.updateProfile(tenantId, userId, input);
    if (!user) throw new AppError("Utente non trovato", 404, "NOT_FOUND");
    return user;
  }

  async changePassword(
    tenantId: string,
    userId: string,
    input: { currentPassword: string; newPassword: string; logoutAllDevices?: boolean }
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { passwordHash: true }
    });
    if (!user) throw new AppError("Utente non trovato", 404, "NOT_FOUND");

    const validCurrent = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!validCurrent) throw new AppError("Password attuale non valida", 400, "VALIDATION_ERROR");

    const samePassword = await bcrypt.compare(input.newPassword, user.passwordHash);
    if (samePassword) throw new AppError("La nuova password deve essere diversa dalla precedente", 400, "VALIDATION_ERROR");

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    if (input.logoutAllDevices) {
      await this.authSessionService.revokeAll(userId);
      return { updated: true, sessionsRevoked: true };
    }

    return { updated: true, sessionsRevoked: false };
  }
}
