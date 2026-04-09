import crypto from "node:crypto";
import { prisma } from "../../infrastructure/database/prisma/client.js";
import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user-repository.js";
import { AppError } from "../../shared/errors/app-error.js";
import { TokenService } from "./token-service.js";

const REFRESH_TTL_DAYS = 30;

const hashToken = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export class AuthSessionService {
  constructor(private readonly tokenService: TokenService, private readonly userRepository: PrismaUserRepository) {}

  private generateRefreshToken() {
    return crypto.randomBytes(48).toString("hex");
  }

  async createSession(input: {
    userId: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
    userAgent?: string;
    ipAddress?: string;
  }) {
    const rawRefresh = this.generateRefreshToken();
    const refreshHash = hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86400000);

    const session = await prisma.refreshSession.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        tokenHash: refreshHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt
      }
    });

    if (input.ipAddress) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentSessions = await prisma.refreshSession.findMany({
        where: { userId: input.userId, createdAt: { gte: dayAgo } },
        select: { ipAddress: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30
      });
      const uniqueIps = new Set(recentSessions.map((x) => x.ipAddress).filter(Boolean));
      if (uniqueIps.size >= 4) {
        await prisma.auditLog.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            action: "SECURITY_ALERT_SESSION_ANOMALY",
            resource: "security",
            details: {
              uniqueIpsLast24h: uniqueIps.size,
              ipAddress: input.ipAddress,
              sample: Array.from(uniqueIps).slice(0, 6)
            } as any
          }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        action: "AUTH_SESSION_CREATED",
        resource: "auth_session",
        resourceId: session.id,
        details: {
          sessionId: session.id,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null
        } as any
      }
    });

    const accessToken = this.tokenService.signAccess({
      userId: input.userId,
      tenantId: input.tenantId,
      roles: input.roles,
      permissions: input.permissions,
      tokenType: "access",
      sessionId: session.id
    });

    return { accessToken, refreshToken: rawRefresh, sessionId: session.id, refreshExpiresAt: expiresAt.toISOString() };
  }

  async refresh(rawRefreshToken: string, userAgent?: string, ipAddress?: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const current = await prisma.refreshSession.findUnique({ where: { tokenHash } });

    if (!current || current.revokedAt || current.expiresAt.getTime() < Date.now()) {
      throw new AppError("Refresh token non valido", 401, "UNAUTHORIZED");
    }

    const user = await this.userRepository.findById(current.userId);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Utente non attivo", 403, "FORBIDDEN");
    }

    const rotated = await this.createSession({
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      userAgent,
      ipAddress
    });

    await prisma.refreshSession.update({
      where: { id: current.id },
      data: { revokedAt: new Date(), replacedById: rotated.sessionId }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: current.tenantId,
        userId: current.userId,
        action: "AUTH_SESSION_REFRESHED",
        resource: "auth_session",
        resourceId: current.id,
        details: {
          oldSessionId: current.id,
          newSessionId: rotated.sessionId,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null
        } as any
      }
    });

    return { ...rotated, user };
  }

  async revokeCurrent(sessionId: string, userId: string) {
    const result = await prisma.refreshSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (result.count > 0) {
      const session = await prisma.refreshSession.findFirst({
        where: { id: sessionId, userId },
        select: { tenantId: true }
      });
      if (session) {
        await prisma.auditLog.create({
          data: {
            tenantId: session.tenantId,
            userId,
            action: "AUTH_SESSION_REVOKED_CURRENT",
            resource: "auth_session",
            resourceId: sessionId
          }
        });
      }
    }
    return { revoked: true };
  }

  async revokeById(sessionId: string, userId: string) {
    const result = await prisma.refreshSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (result.count > 0) {
      const session = await prisma.refreshSession.findFirst({
        where: { id: sessionId, userId },
        select: { tenantId: true }
      });
      if (session) {
        await prisma.auditLog.create({
          data: {
            tenantId: session.tenantId,
            userId,
            action: "AUTH_SESSION_REVOKED_BY_ID",
            resource: "auth_session",
            resourceId: sessionId
          }
        });
      }
    }
    return { revoked: true };
  }

  async revokeAll(userId: string) {
    const sessions = await prisma.refreshSession.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, tenantId: true },
      take: 100
    });

    await prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

    const tenantId = sessions[0]?.tenantId;
    if (tenantId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "AUTH_SESSIONS_REVOKED_ALL",
          resource: "auth_session",
          details: {
            count: sessions.length
          } as any
        }
      });
    }
    return { revoked: true };
  }

  async list(userId: string) {
    const data = await prisma.refreshSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true
      }
    });
    return { data };
  }
}
