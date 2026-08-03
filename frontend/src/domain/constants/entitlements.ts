import {
  ANNUAL_DISCOUNT_PERCENT,
  COMMERCIAL_PLAN_CATALOG,
  PLAN_ENTITLEMENTS as SHARED_PLAN_ENTITLEMENTS,
  PLAN_MONTHLY_PRICING_EUR as SHARED_PLAN_MONTHLY_PRICING_EUR,
  PLAN_YEARLY_PRICING_EUR as SHARED_PLAN_YEARLY_PRICING_EUR,
  SAAS_PLAN_CODES,
  getCommercialFeatureRequiredPlan,
  getCommercialPlanFeatures,
  hasCommercialPlanFeature,
  normalizeSaasPlan
} from "@fleetum/commercial-plan-catalog";
import type { FeatureKey as SharedFeatureKey, SaasPlanCode } from "@fleetum/commercial-plan-catalog";

export const SAAS_PLANS = [...SAAS_PLAN_CODES] as const;

export type SaasPlan = SaasPlanCode;
export { ANNUAL_DISCOUNT_PERCENT, COMMERCIAL_PLAN_CATALOG };

export const PLAN_LEVELS: Record<SaasPlan, number> = {
  STARTER: 1,
  PRO: 2,
  ENTERPRISE: 3
};

export const PLAN_MONTHLY_PRICING_EUR: Record<SaasPlan, number> = {
  ...SHARED_PLAN_MONTHLY_PRICING_EUR
};

export const PLAN_YEARLY_PRICING_EUR: Record<SaasPlan, number> = {
  ...SHARED_PLAN_YEARLY_PRICING_EUR
};

export type FeatureKey = SharedFeatureKey;

export const PLAN_ENTITLEMENTS: Record<SaasPlan, readonly FeatureKey[]> = {
  STARTER: SHARED_PLAN_ENTITLEMENTS.STARTER,
  PRO: SHARED_PLAN_ENTITLEMENTS.PRO,
  ENTERPRISE: SHARED_PLAN_ENTITLEMENTS.ENTERPRISE
};

export const ensureKnownPlan = (plan: string | null | undefined): SaasPlan => normalizeSaasPlan(plan);

export const hasFeature = (plan: string | null | undefined, feature: string) =>
  hasCommercialPlanFeature(plan, feature);

export const getRequiredPlanForFeature = (feature: string): SaasPlan | null =>
  getCommercialFeatureRequiredPlan(feature);

export const getFeatureListForPlan = (plan: string | null | undefined): FeatureKey[] =>
  getCommercialPlanFeatures(plan);
