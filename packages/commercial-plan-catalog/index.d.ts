export type SaasPlanCode = "STARTER" | "PRO" | "ENTERPRISE";
export type FeatureKey =
  | "dashboard_overview"
  | "tenant_basic_view"
  | "users_basic"
  | "vehicles_basic"
  | "fermi_basic"
  | "reports_basic"
  | "alerts_basic"
  | "export_pdf_basic"
  | "reports_advanced"
  | "export_csv"
  | "advanced_filters"
  | "scheduled_reports"
  | "bulk_actions"
  | "alerts_advanced"
  | "integrations_basic"
  | "audit_standard"
  | "api_access"
  | "sso"
  | "custom_roles"
  | "audit_advanced"
  | "automations_advanced"
  | "webhooks"
  | "multi_workspace_controls"
  | "priority_support_flags"
  | "security_insights"
  | "white_label_flags";
export type CommercialBillingCycle = "monthly" | "yearly";
export type StripePlanPriceEnvKey =
  | "STRIPE_PRICE_STARTER_MONTHLY"
  | "STRIPE_PRICE_STARTER_YEARLY"
  | "STRIPE_PRICE_PRO_MONTHLY"
  | "STRIPE_PRICE_PRO_YEARLY"
  | "STRIPE_PRICE_ENTERPRISE_MONTHLY"
  | "STRIPE_PRICE_ENTERPRISE_YEARLY";

export type CommercialPlan = Readonly<{
  code: SaasPlanCode;
  label: string;
  currency: "EUR";
  taxInclusive: true;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  stripePriceEnv: Readonly<Record<CommercialBillingCycle, StripePlanPriceEnvKey>>;
}>;

export const COMMERCIAL_CURRENCY: "EUR";
export const COMMERCIAL_PRICES_INCLUDE_TAX: true;
export const ANNUAL_DISCOUNT_BASIS_POINTS: 1500;
export const ANNUAL_DISCOUNT_PERCENT: 15;
export const SAAS_PLAN_CODES: readonly ["STARTER", "PRO", "ENTERPRISE"];
export const PLAN_ENTITLEMENTS: Readonly<Record<SaasPlanCode, readonly FeatureKey[]>>;
export const COMMERCIAL_PLAN_CATALOG: Readonly<Record<SaasPlanCode, CommercialPlan>>;
export const PLAN_MONTHLY_PRICING_EUR: Readonly<Record<SaasPlanCode, number>>;
export const PLAN_YEARLY_PRICING_EUR: Readonly<Record<SaasPlanCode, number>>;
export function getCommercialPlan(code: string | null | undefined): CommercialPlan;
export function getCommercialPlanPriceCents(code: string | null | undefined, billingCycle?: CommercialBillingCycle): number;
export function normalizeSaasPlan(code: string | null | undefined): SaasPlanCode;
export function hasCommercialPlanFeature(code: string | null | undefined, feature: string): boolean;
export function getCommercialPlanFeatures(code: string | null | undefined): FeatureKey[];
export function getCommercialFeatureRequiredPlan(feature: string): SaasPlanCode | null;
