import { NextFunction, Request, RequestHandler, Response } from "express";
import { LicensePolicyService } from "../../../application/services/license-policy-service.js";
import {
  FeatureKey,
  getAllowedPlansForFeature,
  getRequiredPlanForFeature,
  hasFeature
} from "../../../application/services/feature-entitlements-service.js";
import { AuditLogRepository } from "../../../domain/repositories/audit-log-repository.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { getClientIp } from "../../../shared/utils/ip.js";

const buildPlanLimitMessage = (feature: string, requiredPlan: string | null) => {
  if (!requiredPlan) return `Funzionalità ${feature} non disponibile per il tuo piano.`;
  return `Funzionalità ${feature} disponibile dal piano ${requiredPlan}.`;
};

export const createRequireFeature = (licensePolicyService: LicensePolicyService, auditRepository: AuditLogRepository) => {
  return (feature: FeatureKey): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction) => {
      const run = async () => {
        const tenantId = req.auth?.tenantId;
        const userId = req.auth?.userId;
        if (!tenantId || !userId) {
          throw new AppError("Utente non autenticato", 401, "UNAUTHORIZED");
        }

        const entitlements = await licensePolicyService.getTenantEntitlements(tenantId);
        if (hasFeature(entitlements.plan, feature)) {
          next();
          return;
        }

        const requiredPlan = getRequiredPlanForFeature(feature);
        const allowedPlans = getAllowedPlansForFeature(feature);

        await auditRepository.create({
          tenantId,
          userId,
          action: "FEATURE_ACCESS_DENIED",
          resource: "feature",
          resourceId: feature,
          details: {
            feature,
            currentPlan: entitlements.plan,
            requiredPlan,
            allowedPlans,
            sourceIp: getClientIp(req),
            method: req.method,
            path: req.originalUrl,
            happenedAt: new Date().toISOString()
          }
        });

        throw new AppError(
          buildPlanLimitMessage(feature, requiredPlan),
          403,
          "PLAN_LIMIT",
          {
            feature,
            currentPlan: entitlements.plan,
            requiredPlan,
            allowedPlans
          }
        );
      };

      run().catch(next);
    };
  };
};
