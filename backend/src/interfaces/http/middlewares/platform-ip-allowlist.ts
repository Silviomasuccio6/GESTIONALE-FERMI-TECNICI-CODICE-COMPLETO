import { NextFunction, Request, Response } from "express";
import { PlatformAlertService } from "../../../application/services/platform-alert-service.js";
import { env } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { getClientIp, toIpAllowlist } from "../../../shared/utils/ip.js";

const allowed = toIpAllowlist(env.PLATFORM_ALLOWED_IPS_CSV);

export const createPlatformIpAllowlist = (alerts: PlatformAlertService) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    if (allowed.has(ip)) {
      return next();
    }

    await alerts.notify({
      type: "PLATFORM_UNAUTHORIZED_IP",
      actor: "anonymous",
      sourceIp: ip,
      details: `Blocked request to ${req.method} ${req.originalUrl}`
    });

    next(new AppError("Accesso platform non autorizzato per questo IP", 403, "PLATFORM_IP_FORBIDDEN"));
  };
};
