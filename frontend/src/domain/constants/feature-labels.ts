import { FeatureKey, PLAN_ENTITLEMENTS } from "./entitlements";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard_overview: "Dashboard overview",
  tenant_basic_view: "Vista tenant base",
  users_basic: "Gestione utenti base",
  vehicles_basic: "Gestione veicoli base",
  fermi_basic: "Gestione fermi base",
  reports_basic: "Report base",
  alerts_basic: "Alert base",
  export_pdf_basic: "Export PDF",
  reports_advanced: "Report avanzati",
  export_csv: "Export CSV",
  advanced_filters: "Filtri avanzati",
  scheduled_reports: "Report schedulati",
  bulk_actions: "Azioni massive",
  alerts_advanced: "Alert avanzati",
  integrations_basic: "Integrazioni base",
  audit_standard: "Audit standard",
  api_access: "Accesso API",
  sso: "Single Sign-On (SSO)",
  custom_roles: "Ruoli custom",
  audit_advanced: "Audit avanzato",
  automations_advanced: "Automazioni avanzate",
  webhooks: "Webhook",
  multi_workspace_controls: "Controlli multi-workspace",
  priority_support_flags: "Supporto prioritario",
  security_insights: "Security insights",
  white_label_flags: "White-label"
};

export const PAID_FEATURES: FeatureKey[] = [...PLAN_ENTITLEMENTS.PRO, ...PLAN_ENTITLEMENTS.ENTERPRISE];
