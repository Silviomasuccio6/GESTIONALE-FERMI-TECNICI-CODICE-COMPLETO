import bcrypt from "bcryptjs";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { PrismaUserRepository } from "../../../infrastructure/repositories/prisma-user-repository.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { LoginInput } from "../../dtos/auth-dto.js";
import { AuthSessionService } from "../../services/auth-session-service.js";
import { LicensePolicyService } from "../../services/license-policy-service.js";
import { TokenService } from "../../services/token-service.js";

export class LoginUseCase {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly tokenService: TokenService,
    private readonly licensePolicyService: LicensePolicyService,
    private readonly authSessionService: AuthSessionService
  ) {}

  async execute(input: LoginInput, context?: { userAgent?: string; ipAddress?: string }) {
    const candidates = await prisma.user.findMany({
      where: { email: input.email, deletedAt: null },
      select: { id: true, passwordHash: true, status: true }
    });
    if (!candidates.length) throw new AppError("Credenziali non valide", 401, "UNAUTHORIZED");

    const matchingUserIds: string[] = [];
    for (const candidate of candidates) {
      const ok = await bcrypt.compare(input.password, candidate.passwordHash);
      if (ok) matchingUserIds.push(candidate.id);
    }

    if (matchingUserIds.length === 0) throw new AppError("Credenziali non valide", 401, "UNAUTHORIZED");
    if (matchingUserIds.length > 1) {
      throw new AppError(
        "Email associata a più tenant. Contatta supporto per unificare l'utenza.",
        409,
        "AMBIGUOUS_LOGIN"
      );
    }

    const user = await this.userRepository.findById(matchingUserIds[0]);
    if (!user) throw new AppError("Utente non trovato", 404, "NOT_FOUND");
    if (user.status !== "ACTIVE") throw new AppError("Utente non attivo", 403, "FORBIDDEN");
    const access = await this.licensePolicyService.evaluateAccess(user.tenantId);
    if (access.blocked) {
      if (access.reason === "TENANT_INACTIVE") throw new AppError("Tenant disattivato. Contatta l'amministratore.", 403, "TENANT_INACTIVE");
      if (access.reason === "LICENSE_SUSPENDED") throw new AppError("Licenza sospesa. Contatta il supporto.", 403, "LICENSE_SUSPENDED");
      throw new AppError("Licenza scaduta. Rinnova per continuare.", 402, "LICENSE_EXPIRED");
    }

    const session = await this.authSessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress
    });
    const token = this.tokenService.sign({
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      tokenType: "access",
      sessionId: session.sessionId
    });
    return { token, refreshToken: session.refreshToken, refreshExpiresAt: session.refreshExpiresAt, user };
  }
}
