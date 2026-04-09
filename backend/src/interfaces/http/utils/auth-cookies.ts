import crypto from "node:crypto";
import { Request, Response } from "express";
import { env } from "../../../shared/config/env.js";

export const ACCESS_COOKIE_NAME = "fermi_access";
export const REFRESH_COOKIE_NAME = "fermi_refresh";
export const CSRF_COOKIE_NAME = "fermi_csrf";

const isSecure = env.NODE_ENV === "production";
const sameSite: "lax" | "strict" = "lax";

const toCookieOptions = (overrides?: {
  httpOnly?: boolean;
  expiresAt?: string;
}) => ({
  httpOnly: overrides?.httpOnly ?? true,
  secure: isSecure,
  sameSite,
  path: "/",
  ...(overrides?.expiresAt ? { expires: new Date(overrides.expiresAt) } : {})
});

export const setAccessCookie = (res: Response, token: string) => {
  res.cookie(ACCESS_COOKIE_NAME, token, toCookieOptions());
};

export const setRefreshCookie = (res: Response, refreshToken: string, refreshExpiresAt: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, toCookieOptions({ expiresAt: refreshExpiresAt }));
};

export const setCsrfCookie = (res: Response, csrfToken: string) => {
  res.cookie(CSRF_COOKIE_NAME, csrfToken, toCookieOptions({ httpOnly: false }));
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE_NAME, toCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, toCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, toCookieOptions({ httpOnly: false }));
};

export const getCookieValue = (req: Request, name: string) => {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const entries = raw.split(";").map((x) => x.trim());
  for (const entry of entries) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    const key = entry.slice(0, separator);
    if (key !== name) continue;
    return decodeURIComponent(entry.slice(separator + 1));
  }
  return undefined;
};

export const issueCsrfToken = () => crypto.randomBytes(24).toString("base64url");
