import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { JwtPayload } from "../../../shared/types/auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const allowQueryToken = req.method === "GET" && req.path.endsWith("/notifications/stream");
  const tokenFromQuery =
    allowQueryToken && typeof req.query.access_token === "string" ? req.query.access_token : undefined;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : tokenFromQuery;

  if (!token) throw new AppError("Token mancante", 401, "UNAUTHORIZED");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (payload.tokenType && payload.tokenType !== "access") {
      throw new AppError("Token non valido", 401, "UNAUTHORIZED");
    }
    req.auth = payload;
    next();
  } catch {
    throw new AppError("Token non valido", 401, "UNAUTHORIZED");
  }
};
