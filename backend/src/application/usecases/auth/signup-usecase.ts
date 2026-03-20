import bcrypt from "bcryptjs";
import { PrismaUserRepository } from "../../../infrastructure/repositories/prisma-user-repository.js";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { SignupInput } from "../../dtos/auth-dto.js";

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
}
