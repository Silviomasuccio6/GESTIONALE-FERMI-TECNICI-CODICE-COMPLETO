import { env } from "../../shared/config/env.js";
import { AppError } from "../../shared/errors/app-error.js";

type Entry = { failures: number; firstFailureAt: number; lockedUntil?: number };

export type LoginFailureResult = {
  locked: boolean;
  failures: number;
  blockedUntil?: string;
};

export class PlatformLoginGuardService {
  private readonly state = new Map<string, Entry>();

  private makeKey(ip: string, email: string) {
    return `${ip.toLowerCase()}::${email.toLowerCase()}`;
  }

  assertAllowed(ip: string, email: string): void {
    const key = this.makeKey(ip, email);
    const current = this.state.get(key);
    if (!current?.lockedUntil) return;
    if (current.lockedUntil <= Date.now()) {
      this.state.delete(key);
      return;
    }
    throw new AppError("Accesso platform temporaneamente bloccato", 429, "PLATFORM_LOGIN_LOCKED");
  }

  registerFailure(ip: string, email: string): LoginFailureResult {
    const now = Date.now();
    const key = this.makeKey(ip, email);
    const current = this.state.get(key);

    if (!current || now - current.firstFailureAt > env.PLATFORM_LOGIN_WINDOW_MS) {
      this.state.set(key, { failures: 1, firstFailureAt: now });
      return { locked: false, failures: 1 };
    }

    const failures = current.failures + 1;
    const shouldLock = failures >= env.PLATFORM_LOGIN_MAX_ATTEMPTS;
    const lockedUntil = shouldLock ? now + env.PLATFORM_LOGIN_LOCK_MS : current.lockedUntil;

    this.state.set(key, { failures, firstFailureAt: current.firstFailureAt, lockedUntil });

    return {
      locked: shouldLock,
      failures,
      blockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : undefined
    };
  }

  registerSuccess(ip: string, email: string): void {
    this.state.delete(this.makeKey(ip, email));
  }
}
