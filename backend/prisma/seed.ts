import bcrypt from "bcryptjs";
import { PrismaClient, RoleKey } from "@prisma/client";

const prisma = new PrismaClient();

const permissionKeys = [
  "dashboard:read",
  "sites:read",
  "sites:write",
  "workshops:read",
  "workshops:write",
  "vehicles:read",
  "vehicles:write",
  "stoppages:read",
  "stoppages:write",
  "stoppages:delete",
  "stoppages:remind",
  "users:read",
  "users:write",
  "stats:read"
];

const rolePermissions: Record<RoleKey, string[]> = {
  ADMIN: permissionKeys,
  MANAGER: permissionKeys.filter((key) => key !== "users:write"),
  OPERATOR: [
    "dashboard:read",
    "sites:read",
    "workshops:read",
    "vehicles:read",
    "vehicles:write",
    "stoppages:read",
    "stoppages:write",
    "stoppages:remind",
    "stats:read"
  ],
  VIEWER: ["dashboard:read", "sites:read", "workshops:read", "vehicles:read", "stoppages:read", "stats:read"]
};

async function main() {
  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: key },
      create: { key, description: key }
    });
  }

  for (const key of Object.keys(rolePermissions) as RoleKey[]) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: key },
      create: { key, name: key }
    });

    for (const permissionKey of rolePermissions[key]) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: "demo_tenant" },
    update: { name: "Demo Tenant" },
    create: {
      id: "demo_tenant",
      name: "Demo Tenant"
    }
  });

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@demo.local"
      }
    },
    update: {
      passwordHash,
      firstName: "System",
      lastName: "Admin"
    },
    create: {
      tenantId: tenant.id,
      email: "admin@demo.local",
      passwordHash,
      firstName: "System",
      lastName: "Admin",
      isEmailVerified: true
    }
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.ADMIN } });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id
    }
  });

  console.log("Seed completato");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
