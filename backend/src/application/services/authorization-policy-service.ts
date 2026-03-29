import { AppError } from "../../shared/errors/app-error.js";

type AccessContext = {
  permissions: string[];
};

export class AuthorizationPolicyService {
  assertPermissions(context: AccessContext, required: string[]) {
    const hasAll = required.every((permission) => context.permissions.includes(permission));
    if (!hasAll) throw new AppError("Permessi insufficienti", 403, "FORBIDDEN");
  }
}
