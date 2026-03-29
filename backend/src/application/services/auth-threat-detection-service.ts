import { AuditLogRepository } from "../../domain/repositories/audit-log-repository.js";
import { AppError } from "../../shared/errors/app-error.js";

type AttemptInfo = { count: number; firstAt: number; blockedUntil?: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;

export class AuthThreatDetectionService {
  private readonly attempts = new Map<string, AttemptInfo>();

  constructor(private readonly auditRepository: AuditLogRepository) {}

  private key(ip: string | undefined, email: string) {
    return `${ip ?? "unknown"}::${email.toLowerCase()}`;
  }

  async assertAllowed(ip: string | undefined, email: string) {
    const key = this.key(ip, email);
    const current = this.attempts.get(key);
    const now = Date.now();
    if (current?.blockedUntil && current.blockedUntil > now) {
      throw new AppError("Troppi tentativi di login. Riprova più tardi.", 429, "AUTH_RATE_LIMITED");
    }
  }

  async onFailure(ip: string | undefined, email: string, tenantIdForAudit?: string) {
    const key = this.key(ip, email);
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || now - current.firstAt > WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAt: now });
      return;
    }

    const nextCount = current.count + 1;
    const blockedUntil = nextCount >= MAX_ATTEMPTS ? now + BLOCK_MS : current.blockedUntil;
    this.attempts.set(key, { count: nextCount, firstAt: current.firstAt, blockedUntil });

    if (nextCount === MAX_ATTEMPTS && tenantIdForAudit) {
      await this.auditRepository.create({
        tenantId: tenantIdForAudit,
        action: "SECURITY_ALERT_AUTH_BRUTE_FORCE",
        resource: "security",
        details: {
          email,
          ipAddress: ip ?? "unknown",
          blockedUntil: new Date(blockedUntil!).toISOString(),
          attempts: nextCount
        }
      });
    }
  }

  onSuccess(ip: string | undefined, email: string) {
    this.attempts.delete(this.key(ip, email));
  }
}
