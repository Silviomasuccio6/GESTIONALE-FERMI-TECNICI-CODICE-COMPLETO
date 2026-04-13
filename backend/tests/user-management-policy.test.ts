import assert from "node:assert/strict";
import test from "node:test";
import { UserManagementPolicyService } from "../src/application/services/user-management-policy-service.js";
import { AppError } from "../src/shared/errors/app-error.js";

const policy = new UserManagementPolicyService();

test("manager can assign only operator/viewer roles", () => {
  policy.assertCanAssignRole(["MANAGER"], "OPERATOR", "create");
  policy.assertCanAssignRole(["MANAGER"], "VIEWER", "invite");

  assert.throws(
    () => policy.assertCanAssignRole(["MANAGER"], "ADMIN", "create"),
    (error: unknown) => error instanceof AppError && error.code === "RBAC_ROLE_ESCALATION_DENIED"
  );
});

test("manager cannot manage admin target", () => {
  assert.throws(
    () => policy.assertCanManageUser(["MANAGER"], ["ADMIN"], "update"),
    (error: unknown) => error instanceof AppError && error.code === "RBAC_TARGET_FORBIDDEN"
  );
});

test("only admin can suspend users", () => {
  assert.throws(
    () => policy.assertStatusChange(["MANAGER"], "SUSPENDED"),
    (error: unknown) => error instanceof AppError && error.code === "RBAC_SUSPEND_FORBIDDEN"
  );

  policy.assertStatusChange(["ADMIN"], "SUSPENDED");
});
