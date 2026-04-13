import { AppError } from "../../shared/errors/app-error.js";

export type AppRole = "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";

const rolePriority: Record<AppRole, number> = {
  ADMIN: 4,
  MANAGER: 3,
  OPERATOR: 2,
  VIEWER: 1
};

const normalizeRole = (value: string | null | undefined): AppRole | null => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "ADMIN" || raw === "MANAGER" || raw === "OPERATOR" || raw === "VIEWER") return raw;
  return null;
};

export class UserManagementPolicyService {
  getPrimaryRole(roles: string[] | undefined): AppRole {
    const resolved = (roles ?? [])
      .map((role) => normalizeRole(role))
      .filter((role): role is AppRole => role !== null)
      .sort((a, b) => rolePriority[b] - rolePriority[a])[0];

    return resolved ?? "VIEWER";
  }

  assertCanAssignRole(actorRoles: string[] | undefined, targetRoleRaw: string, action: "create" | "invite" | "role_update") {
    const actorRole = this.getPrimaryRole(actorRoles);
    const targetRole = normalizeRole(targetRoleRaw);
    if (!targetRole) throw new AppError("Ruolo non valido", 400, "VALIDATION_ERROR");

    if (actorRole === "ADMIN") return;

    if (actorRole === "MANAGER") {
      if (targetRole === "OPERATOR" || targetRole === "VIEWER") return;
      throw new AppError("Un manager puo gestire solo ruoli Operatore o Viewer", 403, "RBAC_ROLE_ESCALATION_DENIED");
    }

    throw new AppError(`Ruolo ${actorRole} non autorizzato per ${action}`, 403, "RBAC_ACTION_FORBIDDEN");
  }

  assertCanManageUser(actorRoles: string[] | undefined, targetRoles: string[] | undefined, action: "update" | "remove" | "role_update") {
    const actorRole = this.getPrimaryRole(actorRoles);
    const targetRole = this.getPrimaryRole(targetRoles);

    if (actorRole === "ADMIN") return;

    if (actorRole === "MANAGER") {
      if (targetRole === "OPERATOR" || targetRole === "VIEWER") return;
      throw new AppError("Un manager non puo modificare Admin o Manager", 403, "RBAC_TARGET_FORBIDDEN");
    }

    throw new AppError(`Ruolo ${actorRole} non autorizzato per ${action}`, 403, "RBAC_ACTION_FORBIDDEN");
  }

  assertStatusChange(actorRoles: string[] | undefined, nextStatus: "ACTIVE" | "INVITED" | "SUSPENDED") {
    const actorRole = this.getPrimaryRole(actorRoles);
    if (nextStatus === "SUSPENDED" && actorRole !== "ADMIN") {
      throw new AppError("Solo un Admin puo sospendere un utente", 403, "RBAC_SUSPEND_FORBIDDEN");
    }
  }
}
