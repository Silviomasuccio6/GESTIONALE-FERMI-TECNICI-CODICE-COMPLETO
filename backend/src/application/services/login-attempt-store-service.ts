import { prisma } from "../../infrastructure/database/prisma/client.js";

export type RegisterAttemptOptions = {
  windowMs: number;
  maxAttempts: number;
  lockMs: number;
};

export type RegisterAttemptResult = {
  locked: boolean;
  failures: number;
  blockedUntil?: string;
};

const nowDate = () => new Date();

export class LoginAttemptStoreService {
  async assertAllowed(scope: string, identifier: string): Promise<{ blockedUntil?: string }> {
    const state = await prisma.loginRateLimitState.findUnique({
      where: {
        scope_identifier: {
          scope,
          identifier
        }
      },
      select: {
        blockedUntil: true
      }
    });

    if (!state?.blockedUntil) return {};
    if (state.blockedUntil.getTime() <= Date.now()) {
      await prisma.loginRateLimitState.update({
        where: {
          scope_identifier: {
            scope,
            identifier
          }
        },
        data: {
          blockedUntil: null,
          attempts: 0,
          windowStartedAt: nowDate()
        }
      });
      return {};
    }

    return { blockedUntil: state.blockedUntil.toISOString() };
  }

  async registerAttempt(
    scope: string,
    identifier: string,
    options: RegisterAttemptOptions
  ): Promise<RegisterAttemptResult> {
    const now = nowDate();
    const state = await prisma.loginRateLimitState.findUnique({
      where: {
        scope_identifier: {
          scope,
          identifier
        }
      },
      select: {
        attempts: true,
        windowStartedAt: true,
        blockedUntil: true
      }
    });

    if (!state || now.getTime() - state.windowStartedAt.getTime() > options.windowMs) {
      const created = await prisma.loginRateLimitState.upsert({
        where: {
          scope_identifier: {
            scope,
            identifier
          }
        },
        create: {
          scope,
          identifier,
          attempts: 1,
          windowStartedAt: now,
          blockedUntil: null
        },
        update: {
          attempts: 1,
          windowStartedAt: now,
          blockedUntil: null
        },
        select: {
          attempts: true
        }
      });

      return {
        locked: false,
        failures: created.attempts
      };
    }

    const nextAttempts = state.attempts + 1;
    const shouldLock = nextAttempts >= options.maxAttempts;
    const blockedUntil = shouldLock ? new Date(now.getTime() + options.lockMs) : null;

    const updated = await prisma.loginRateLimitState.update({
      where: {
        scope_identifier: {
          scope,
          identifier
        }
      },
      data: {
        attempts: nextAttempts,
        blockedUntil
      },
      select: {
        attempts: true,
        blockedUntil: true
      }
    });

    return {
      locked: shouldLock,
      failures: updated.attempts,
      blockedUntil: updated.blockedUntil?.toISOString()
    };
  }

  async clear(scope: string, identifier: string): Promise<void> {
    await prisma.loginRateLimitState.deleteMany({
      where: {
        scope,
        identifier
      }
    });
  }
}
