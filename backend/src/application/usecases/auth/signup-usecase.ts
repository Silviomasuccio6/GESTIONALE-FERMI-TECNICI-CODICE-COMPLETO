import bcrypt from "bcryptjs";
import { PrismaUserRepository } from "../../../infrastructure/repositories/prisma-user-repository.js";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { SignupInput } from "../../dtos/auth-dto.js";

type SocialSignupInput = {
  email: string;
  provider: "google" | "apple";
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

export class SignupUseCase {
  constructor(private readonly userRepository: PrismaUserRepository) {}

  async execute(input: SignupInput) {
    const globalExisting = await prisma.user.findFirst({ where: { email: input.email, deletedAt: null } });
    if (globalExisting) throw new AppError("Email già utilizzata", 409, "CONFLICT");

    const tenant = await prisma.tenant.create({ data: { name: input.tenantName } });
    const existing = await this.userRepository.findByEmail(tenant.id, input.email);
    if (existing) throw new AppError("Email già utilizzata", 409, "CONFLICT");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.userRepository.create({
      tenantId: tenant.id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleKey: "ADMIN"
    });

    return { tenantId: tenant.id, user };
  }
  async executeSocial(input: SocialSignupInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email social non valida", 400, "INVALID_SOCIAL_EMAIL");

    const globalExisting = await prisma.user.findFirst({ where: { email: normalizedEmail, deletedAt: null } });
    if (globalExisting) throw new AppError("Email già utilizzata", 409, "CONFLICT");

    const localPart = normalizedEmail.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, " ").trim() || "Tenant";
    const nameParts = (input.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = (input.firstName?.trim() || nameParts[0] || "Admin").slice(0, 60);
    const lastName = (input.lastName?.trim() || nameParts.slice(1).join(" ") || input.provider.toUpperCase()).slice(0, 60);

    const titleLocal = localPart
      .split(/\s+/)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
      .join(" ");
    const tenantName = `${titleLocal || "Nuovo"} Workspace`;

    const randomPassword = `S!${Math.random().toString(36).slice(2, 12)}A1`;
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    const user = await this.userRepository.create({
      tenantId: tenant.id,
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      roleKey: "ADMIN"
    });

    return { tenantId: tenant.id, user };
  }

}
