import {
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

export { COMMERCIAL_PLAN_CATALOG };

export const SAAS_PLANS = [...SAAS_PLAN_CODES] as const;

export type SaasPlan = SaasPlanCode;

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

export const getFeatureListForPlan = (plan: string | null | undefined): FeatureKey[] =>
  getCommercialPlanFeatures(plan);

export const hasFeature = (plan: string | null | undefined, feature: string): feature is FeatureKey =>
  hasCommercialPlanFeature(plan, feature);

export const getRequiredPlanForFeature = (feature: string): SaasPlan | null =>
  getCommercialFeatureRequiredPlan(feature);

export const getAllowedPlansForFeature = (feature: string): SaasPlan[] => {
  return (SAAS_PLANS as readonly SaasPlan[]).filter((plan) => hasCommercialPlanFeature(plan, feature));
};

export const getPlanMonthlyPrice = (plan: string | null | undefined): number => {
  return PLAN_MONTHLY_PRICING_EUR[ensureKnownPlan(plan)];
};

export const getPlanYearlyPrice = (plan: string | null | undefined): number => {
  return PLAN_YEARLY_PRICING_EUR[ensureKnownPlan(plan)];
};

export type BillingCycle = "monthly" | "yearly";

export const normalizeBillingCycle = (value: string | null | undefined): BillingCycle => {
  return value === "yearly" ? "yearly" : "monthly";
};

export const estimateLicenseMonthlyRevenue = (input: {
  plan: string;
  seats: number;
  priceMonthly?: number | null;
  billingCycle?: string | null;
}) => {
  const plan = ensureKnownPlan(input.plan);
  const configuredMonthly = Number.isFinite(input.priceMonthly) && Number(input.priceMonthly) > 0
    ? Number(input.priceMonthly)
    : getPlanMonthlyPrice(plan);

  const monthlyBase = normalizeBillingCycle(input.billingCycle) === "yearly"
    ? configuredMonthly / 12
    : configuredMonthly;

  const seats = Number.isFinite(input.seats) ? Math.max(1, Math.floor(Number(input.seats))) : 1;
  const mrr = monthlyBase * seats;

  return {
    plan,
    basePriceMonthly: Number(monthlyBase.toFixed(2)),
    seatsFactor: seats,
    estimatedMrr: Number(mrr.toFixed(2))
  };
};
