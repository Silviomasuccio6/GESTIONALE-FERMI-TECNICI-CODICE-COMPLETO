import bcrypt from "bcryptjs";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { EmailQueueService, createRawToken, hashToken } from "../../../infrastructure/email/email-queue-service.js";
import { env } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { PrismaUserRepository } from "../../../infrastructure/repositories/prisma-user-repository.js";
import { UserManagementPolicyService } from "../../services/user-management-policy-service.js";

type ActorContext = {
  userId: string;
  roles: string[];
};

export class ManageUsersUseCases {
  private readonly policy = new UserManagementPolicyService();

  constructor(private readonly userRepository: PrismaUserRepository, private readonly emailQueueService: EmailQueueService) {}

  private async writeAudit(
    tenantId: string,
    actorUserId: string,
    action: string,
    resourceId: string,
    details?: Record<string, unknown>
  ) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        action,
        resource: "user",
        resourceId,
        details: (details ?? null) as any
      }
    });
  }

  private async assertAdminContinuity(
    tenantId: string,
    targetUserId: string,
    targetRoles: string[] | undefined,
    operation: "suspend" | "delete" | "demote"
  ) {
    const targetPrimaryRole = this.policy.getPrimaryRole(targetRoles);
    if (targetPrimaryRole !== "ADMIN") return;

    const activeAdminsExcludingTarget = await this.userRepository.countActiveAdmins(tenantId, targetUserId);
    if (activeAdminsExcludingTarget >= 1) return;

    const messageByOperation = {
      suspend: "Impossibile sospendere l'ultimo Admin attivo del tenant",
      delete: "Impossibile rimuovere l'ultimo Admin attivo del tenant",
      demote: "Impossibile declassare l'ultimo Admin attivo del tenant"
    } as const;

    throw new AppError(messageByOperation[operation], 409, "RBAC_LAST_ADMIN_GUARD");
  }

  list(tenantId: string) {
    return this.userRepository.list(tenantId);
  }

  listRoles() {
    return this.userRepository.listRoles();
  }

  async create(
    tenantId: string,
    input: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      roleKey: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";
    },
    actor: ActorContext
  ) {
    this.policy.assertCanAssignRole(actor.roles, input.roleKey, "create");
    const existing = await this.userRepository.findByEmail(tenantId, input.email);
    if (existing) throw new AppError("Email già presente nel tenant", 409, "CONFLICT");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const created = await this.userRepository.create({
      tenantId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleKey: input.roleKey
    });
    await this.writeAudit(tenantId, actor.userId, "USER_CREATED", created.id, {
      email: created.email,
      role: input.roleKey
    });
    return created;
  }

  async updateProfile(
    tenantId: string,
    userId: string,
    input: Partial<{ firstName: string; lastName: string; status: "ACTIVE" | "INVITED" | "SUSPENDED" }>,
    actor: ActorContext
  ) {
    const target = await this.userRepository.getByIdInTenant(tenantId, userId);
    if (!target) throw new AppError("Utente non trovato", 404, "NOT_FOUND");

    this.policy.assertCanManageUser(actor.roles, target.roles, "update");
    if (input.status) this.policy.assertStatusChange(actor.roles, input.status);

    if (input.status === "SUSPENDED") {
      await this.assertAdminContinuity(tenantId, userId, target.roles, "suspend");
    }

    const user = await this.userRepository.updateProfile(tenantId, userId, input);
    if (!user) throw new AppError("Utente non trovato", 404, "NOT_FOUND");
    await this.writeAudit(tenantId, actor.userId, "USER_PROFILE_UPDATED", user.id, {
      fields: Object.keys(input ?? {}),
      status: input.status ?? null
    });
    return user;
  }

  async setRole(
    tenantId: string,
    userId: string,
    roleKey: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER",
    actor: ActorContext
  ) {
    if (userId === actor.userId) {
      throw new AppError("Non puoi modificare il tuo ruolo", 400, "RBAC_SELF_ROLE_CHANGE_DENIED");
    }

    const target = await this.userRepository.getByIdInTenant(tenantId, userId);
    if (!target) throw new AppError("Utente non trovato", 404, "NOT_FOUND");

    this.policy.assertCanManageUser(actor.roles, target.roles, "role_update");
    this.policy.assertCanAssignRole(actor.roles, roleKey, "role_update");

    const currentRole = this.policy.getPrimaryRole(target.roles);
    if (currentRole === "ADMIN" && roleKey !== "ADMIN") {
      await this.assertAdminContinuity(tenantId, userId, target.roles, "demote");
    }

    const user = await this.userRepository.setRole(tenantId, userId, roleKey);
    if (!user) throw new AppError("Utente non trovato", 404, "NOT_FOUND");
    await this.writeAudit(tenantId, actor.userId, "USER_ROLE_UPDATED", user.id, {
      from: currentRole,
      to: roleKey
    });
    return user;
  }

  async remove(tenantId: string, userId: string, actor: ActorContext) {
    if (userId === actor.userId) throw new AppError("Non puoi eliminare il tuo account", 400, "VALIDATION_ERROR");

    const target = await this.userRepository.getByIdInTenant(tenantId, userId);
    if (!target) throw new AppError("Utente non trovato", 404, "NOT_FOUND");

    this.policy.assertCanManageUser(actor.roles, target.roles, "remove");
    await this.assertAdminContinuity(tenantId, userId, target.roles, "delete");

    await this.userRepository.softDelete(tenantId, userId);
    await this.writeAudit(tenantId, actor.userId, "USER_DEACTIVATED", userId, {
      targetRole: this.policy.getPrimaryRole(target.roles)
    });
  }

  async invite(
    tenantId: string,
    input: {
      email: string;
      firstName: string;
      lastName: string;
      roleKey: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";
    },
    actor: ActorContext
  ) {
    this.policy.assertCanAssignRole(actor.roles, input.roleKey, "invite");
    const existing = await this.userRepository.findByEmail(tenantId, input.email);
    if (existing) throw new AppError("Email già presente nel tenant", 409, "CONFLICT");

    const placeholderPassword = await bcrypt.hash(createRawToken(), 12);
    const user = await this.userRepository.create({
      tenantId,
      email: input.email,
      passwordHash: placeholderPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      roleKey: input.roleKey
    });
    await this.userRepository.updateProfile(tenantId, user.id, { status: "INVITED" });

    const rawToken = createRawToken();
    await prisma.invitationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    });

    const link = `${env.APP_URL}/accept-invite?token=${rawToken}`;
    const subject = "Invito Gestione Fermi";
    const body = `Ciao ${input.firstName},\\n\\nsei stato invitato su Gestione Fermi. Completa l'attivazione dal link:\\n${link}\\n\\nIl link scade tra 7 giorni.`;

    await this.emailQueueService.enqueue({
      tenantId,
      type: "USER_INVITATION",
      recipient: input.email,
      subject,
      body
    });

    await this.writeAudit(tenantId, actor.userId, "USER_INVITED", user.id, {
      email: input.email,
      role: input.roleKey
    });

    return { invited: true };
  }
}
