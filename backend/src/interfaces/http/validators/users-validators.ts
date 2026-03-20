import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "La password deve contenere almeno una maiuscola")
    .regex(/[0-9]/, "La password deve contenere almeno un numero")
    .regex(/[^A-Za-z0-9]/, "La password deve contenere almeno un carattere speciale"),
  roleKey: z.enum(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]).default("OPERATOR")
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  roleKey: z.enum(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]).default("OPERATOR")
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional()
});

export const updateUserRoleSchema = z.object({
  roleKey: z.enum(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"])
});
