import { AuditLogRepository } from "../../domain/repositories/audit-log-repository.js";
import { AppError } from "../../shared/errors/app-error.js";
import { LoginAttemptStoreService } from "./login-attempt-store-service.js";

type AttemptInfo = { locked: boolean; failures: number; blockedUntil?: string };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;
const AUTH_LOGIN_SCOPE = "auth-login";

export class AuthThreatDetectionService {
  constructor(
    private readonly auditRepository: AuditLogRepository,
    private readonly attemptsStore = new LoginAttemptStoreService()
  ) {}

  private key(ip: string | undefined, email: string) {
    return `${(ip ?? "unknown").toLowerCase()}::${email.toLowerCase()}`;
  }

  async assertAllowed(ip: string | undefined, email: string) {
    const block = await this.attemptsStore.assertAllowed(AUTH_LOGIN_SCOPE, this.key(ip, email));
    if (!block.blockedUntil) return;

    throw new AppError("Troppi tentativi di login. Riprova più tardi.", 429, "AUTH_RATE_LIMITED", {
      blockedUntil: block.blockedUntil
    });
  }

  async onFailure(ip: string | undefined, email: string, tenantIdForAudit?: string) {
    const result: AttemptInfo = await this.attemptsStore.registerAttempt(
      AUTH_LOGIN_SCOPE,
      this.key(ip, email),
      {
        windowMs: WINDOW_MS,
        maxAttempts: MAX_ATTEMPTS,
        lockMs: BLOCK_MS
      }
    );

    if (result.locked && tenantIdForAudit) {
      await this.auditRepository.create({
        tenantId: tenantIdForAudit,
        action: "SECURITY_ALERT_AUTH_BRUTE_FORCE",
        resource: "security",
        details: {
          email,
          ipAddress: ip ?? "unknown",
          blockedUntil: result.blockedUntil,
          attempts: result.failures
        }
      });
    }
  }

  async onSuccess(ip: string | undefined, email: string) {
    await this.attemptsStore.clear(AUTH_LOGIN_SCOPE, this.key(ip, email));
  }
}
