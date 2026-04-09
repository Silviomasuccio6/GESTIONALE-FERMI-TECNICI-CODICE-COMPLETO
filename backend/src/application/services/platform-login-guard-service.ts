import { env } from "../../shared/config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { LoginAttemptStoreService } from "./login-attempt-store-service.js";

export type LoginFailureResult = {
  locked: boolean;
  failures: number;
  blockedUntil?: string;
};

const PLATFORM_LOGIN_SCOPE = "platform-login";

export class PlatformLoginGuardService {
  constructor(private readonly attemptsStore = new LoginAttemptStoreService()) {}

  private makeKey(ip: string, email: string) {
    return `${ip.toLowerCase()}::${email.toLowerCase()}`;
  }

  async assertAllowed(ip: string, email: string): Promise<void> {
    const key = this.makeKey(ip, email);
    const block = await this.attemptsStore.assertAllowed(PLATFORM_LOGIN_SCOPE, key);
    if (!block.blockedUntil) return;

    throw new AppError("Accesso platform temporaneamente bloccato", 429, "PLATFORM_LOGIN_LOCKED", {
      blockedUntil: block.blockedUntil
    });
  }

  async registerFailure(ip: string, email: string): Promise<LoginFailureResult> {
    return this.attemptsStore.registerAttempt(PLATFORM_LOGIN_SCOPE, this.makeKey(ip, email), {
      maxAttempts: env.PLATFORM_LOGIN_MAX_ATTEMPTS,
      windowMs: env.PLATFORM_LOGIN_WINDOW_MS,
      lockMs: env.PLATFORM_LOGIN_LOCK_MS
    });
  }

  async registerSuccess(ip: string, email: string): Promise<void> {
    await this.attemptsStore.clear(PLATFORM_LOGIN_SCOPE, this.makeKey(ip, email));
  }
}
