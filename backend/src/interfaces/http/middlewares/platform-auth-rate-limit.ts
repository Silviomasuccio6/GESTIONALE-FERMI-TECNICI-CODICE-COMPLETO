import { NextFunction, Request, Response } from "express";
import { LoginAttemptStoreService } from "../../../application/services/login-attempt-store-service.js";
import { AppError } from "../../../shared/errors/app-error.js";

const PLATFORM_LOGIN_SCOPE = "platform-login";
const attemptsStore = new LoginAttemptStoreService();

const normalizeIp = (value?: string | null) => (value ?? "unknown").trim().toLowerCase();

export const platformAuthRateLimit = (req: Request, _res: Response, next: NextFunction) => {
  const email = typeof req.body?.email === "string" ? req.body.email : "";
  if (!email) {
    next(new AppError("Email richiesta", 400, "VALIDATION_ERROR"));
    return;
  }

  const key = `${normalizeIp(req.ip)}::${email.toLowerCase()}`;
  void attemptsStore
    .assertAllowed(PLATFORM_LOGIN_SCOPE, key)
    .then((blocked) => {
      if (blocked.blockedUntil) {
        throw new AppError("Troppi tentativi platform. Riprova più tardi.", 429, "AUTH_RATE_LIMITED", {
          blockedUntil: blocked.blockedUntil
        });
      }
      next();
    })
    .catch(next);
};
