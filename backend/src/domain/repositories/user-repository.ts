import { UserEntity } from "../entities/user.js";

export interface UserRepository {
  findByEmail(tenantId: string, email: string): Promise<UserEntity | null>;
  findById(userId: string): Promise<UserEntity | null>;
  create(input: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleKey?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";
  }): Promise<UserEntity>;
  list(tenantId: string): Promise<UserEntity[]>;
  listRoles(): Promise<Array<"ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER">>;
  updateProfile(
    tenantId: string,
    userId: string,
    input: Partial<{ firstName: string; lastName: string; status: "ACTIVE" | "INVITED" | "SUSPENDED" }>
  ): Promise<UserEntity | null>;
  setRole(tenantId: string, userId: string, roleKey: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER"): Promise<UserEntity | null>;
  softDelete(tenantId: string, userId: string): Promise<void>;
}
