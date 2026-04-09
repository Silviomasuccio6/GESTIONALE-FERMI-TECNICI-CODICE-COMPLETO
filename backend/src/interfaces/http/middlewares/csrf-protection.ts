import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error.js";
import { CSRF_COOKIE_NAME, getCookieValue } from "../utils/auth-cookies.js";

const stateChangingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const requireCsrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (!stateChangingMethods.has(req.method.toUpperCase())) {
    next();
    return;
  }

  // Le richieste con Bearer token non sono vulnerabili a CSRF nel classico scenario browser-cookie.
  // Manteniamo la protezione CSRF per i flussi autenticati via cookie.
  const authHeader = req.headers.authorization;
  const hasBearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ");
  if (hasBearerToken) {
    next();
    return;
  }

  const cookieToken = getCookieValue(req, CSRF_COOKIE_NAME);
  const headerToken = String(req.headers["x-csrf-token"] ?? "");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError("Token CSRF non valido", 403, "CSRF_INVALID"));
    return;
  }

  next();
};
