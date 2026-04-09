import { NextFunction, Request, Response } from "express";
import { LoginAttemptStoreService } from "../../../application/services/login-attempt-store-service.js";
import { AppError } from "../../../shared/errors/app-error.js";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const LIMIT = 12;
const AUTH_ROUTE_SCOPE = "auth-route";

const attemptsStore = new LoginAttemptStoreService();

const normalizeIp = (value?: string | null) => (value ?? "unknown").trim().toLowerCase();

const keyOf = (req: Request) => {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "na";
  return `${normalizeIp(req.ip)}::${email}::${req.path}`;
};

export const authRateLimit = (req: Request, _res: Response, next: NextFunction) => {
  const key = keyOf(req);

  void attemptsStore
    .assertAllowed(AUTH_ROUTE_SCOPE, key)
    .then((block) => {
      if (block.blockedUntil) {
        throw new AppError("Troppi tentativi. Riprova più tardi.", 429, "AUTH_RATE_LIMITED", {
          blockedUntil: block.blockedUntil
        });
      }

      return attemptsStore.registerAttempt(AUTH_ROUTE_SCOPE, key, {
        windowMs: WINDOW_MS,
        lockMs: BLOCK_MS,
        maxAttempts: LIMIT
      });
    })
    .then((result) => {
      if (result.locked) {
        throw new AppError("Troppi tentativi. Riprova più tardi.", 429, "AUTH_RATE_LIMITED", {
          blockedUntil: result.blockedUntil
        });
      }
      next();
    })
    .catch(next);
};
