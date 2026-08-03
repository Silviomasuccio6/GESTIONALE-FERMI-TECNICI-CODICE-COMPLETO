export const COMMERCIAL_CURRENCY = "EUR";
export const COMMERCIAL_PRICES_INCLUDE_TAX = true;
export const ANNUAL_DISCOUNT_BASIS_POINTS = 1500;
export const ANNUAL_DISCOUNT_PERCENT = ANNUAL_DISCOUNT_BASIS_POINTS / 100;
export const SAAS_PLAN_CODES = Object.freeze(["STARTER", "PRO", "ENTERPRISE"]);

const STARTER_FEATURES = Object.freeze([
  "dashboard_overview",
  "tenant_basic_view",
  "users_basic",
  "vehicles_basic",
  "fermi_basic",
  "reports_basic",
  "alerts_basic",
  "export_pdf_basic"
]);

const PRO_FEATURES = Object.freeze([
  "reports_advanced",
  "export_csv",
  "advanced_filters",
  "scheduled_reports",
  "bulk_actions",
  "alerts_advanced",
  "integrations_basic",
  "audit_standard"
]);

const ENTERPRISE_FEATURES = Object.freeze([
  "api_access",
  "sso",
  "custom_roles",
  "audit_advanced",
  "automations_advanced",
  "webhooks",
  "multi_workspace_controls",
  "priority_support_flags",
  "security_insights",
  "white_label_flags"
]);

export const PLAN_ENTITLEMENTS = Object.freeze({
  STARTER: STARTER_FEATURES,
  PRO: PRO_FEATURES,
  ENTERPRISE: ENTERPRISE_FEATURES
});

const cumulativeEntitlements = Object.freeze({
  STARTER: new Set(STARTER_FEATURES),
  PRO: new Set([...STARTER_FEATURES, ...PRO_FEATURES]),
  ENTERPRISE: new Set([...STARTER_FEATURES, ...PRO_FEATURES, ...ENTERPRISE_FEATURES])
});

export const normalizeSaasPlan = (planCode) =>
  SAAS_PLAN_CODES.includes(planCode) ? planCode : "STARTER";

export const hasCommercialPlanFeature = (planCode, feature) =>
  cumulativeEntitlements[normalizeSaasPlan(planCode)].has(feature);

export const getCommercialPlanFeatures = (planCode) =>
  Array.from(cumulativeEntitlements[normalizeSaasPlan(planCode)]);

export const getCommercialFeatureRequiredPlan = (feature) =>
  SAAS_PLAN_CODES.find((planCode) => cumulativeEntitlements[planCode].has(feature)) ?? null;

const annualPrice = (monthlyPriceCents) =>
  Math.round(monthlyPriceCents * 12 * (10_000 - ANNUAL_DISCOUNT_BASIS_POINTS) / 10_000);

const plan = (code, label, monthlyPriceCents, monthlyEnvKey, yearlyEnvKey) => Object.freeze({
  code,
  label,
  currency: COMMERCIAL_CURRENCY,
  taxInclusive: COMMERCIAL_PRICES_INCLUDE_TAX,
  monthlyPriceCents,
  yearlyPriceCents: annualPrice(monthlyPriceCents),
  stripePriceEnv: Object.freeze({ monthly: monthlyEnvKey, yearly: yearlyEnvKey })
});

export const COMMERCIAL_PLAN_CATALOG = Object.freeze({
  STARTER: plan("STARTER", "Starter", 14_900, "STRIPE_PRICE_STARTER_MONTHLY", "STRIPE_PRICE_STARTER_YEARLY"),
  PRO: plan("PRO", "Pro", 19_900, "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_PRO_YEARLY"),
  ENTERPRISE: plan("ENTERPRISE", "Enterprise", 24_900, "STRIPE_PRICE_ENTERPRISE_MONTHLY", "STRIPE_PRICE_ENTERPRISE_YEARLY")
});

export const PLAN_MONTHLY_PRICING_EUR = Object.freeze(Object.fromEntries(
  SAAS_PLAN_CODES.map((code) => [code, COMMERCIAL_PLAN_CATALOG[code].monthlyPriceCents / 100])
));

export const PLAN_YEARLY_PRICING_EUR = Object.freeze(Object.fromEntries(
  SAAS_PLAN_CODES.map((code) => [code, COMMERCIAL_PLAN_CATALOG[code].yearlyPriceCents / 100])
));

export const getCommercialPlan = (code) => COMMERCIAL_PLAN_CATALOG[code] ?? COMMERCIAL_PLAN_CATALOG.STARTER;

export const getCommercialPlanPriceCents = (code, billingCycle = "monthly") => {
  const selectedPlan = getCommercialPlan(code);
  return billingCycle === "yearly" ? selectedPlan.yearlyPriceCents : selectedPlan.monthlyPriceCents;
};
