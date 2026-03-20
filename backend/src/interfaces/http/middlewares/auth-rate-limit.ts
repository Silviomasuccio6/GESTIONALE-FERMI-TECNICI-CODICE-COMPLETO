import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error.js";

type Entry = { count: number; firstAt: number; blockedUntil?: number };

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const LIMIT = 12;

const state = new Map<string, Entry>();

const keyOf = (req: Request) => {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "na";
  return `${req.ip ?? "unknown"}::${email}`;
};

export const authRateLimit = (req: Request, _res: Response, next: NextFunction) => {
  const now = Date.now();
  const key = keyOf(req);
  const current = state.get(key);

  if (current?.blockedUntil && current.blockedUntil > now) {
    throw new AppError("Troppi tentativi. Riprova più tardi.", 429, "AUTH_RATE_LIMITED");
  }

  if (!current || now - current.firstAt > WINDOW_MS) {
    state.set(key, { count: 1, firstAt: now });
    return next();
  }

  const nextCount = current.count + 1;
  if (nextCount > LIMIT) {
    state.set(key, { count: nextCount, firstAt: current.firstAt, blockedUntil: now + BLOCK_MS });
    throw new AppError("Troppi tentativi. Riprova più tardi.", 429, "AUTH_RATE_LIMITED");
  }

  state.set(key, { count: nextCount, firstAt: current.firstAt, blockedUntil: current.blockedUntil });
  next();
};
