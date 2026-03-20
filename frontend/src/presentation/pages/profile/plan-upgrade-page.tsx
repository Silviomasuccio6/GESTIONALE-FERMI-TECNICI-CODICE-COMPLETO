import { Link } from "react-router-dom";
import {
  FeatureKey,
  getFeatureListForPlan,
  PLAN_MONTHLY_PRICING_EUR,
  SAAS_PLANS
} from "../../../domain/constants/entitlements";
import { useEntitlements } from "../../hooks/use-entitlements";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

const featureLabels: Record<FeatureKey, string> = {
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

const orderedFeatures = getFeatureListForPlan("ENTERPRISE");

export const PlanUpgradePage = () => {
  const { plan, loading } = useEntitlements();
  const currentPlan = loading ? null : plan;

  return (
    <section className="space-y-5">
      <PageHeader
        title="Upgrade Piano"
        subtitle="Confronta i piani e scegli il livello migliore per il tuo tenant."
        actions={
          <>
            {currentPlan ? (
              <Badge variant="secondary" className="uppercase tracking-[0.08em]">
                Piano attivo: {currentPlan}
              </Badge>
            ) : null}
            <Link
              to="/profilo"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-semibold hover:bg-muted/60"
            >
              Vai a Profilo
            </Link>
          </>
        }
      />

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Prezzi mensili: STARTER {PLAN_MONTHLY_PRICING_EUR.STARTER} EUR, PRO {PLAN_MONTHLY_PRICING_EUR.PRO} EUR, ENTERPRISE {PLAN_MONTHLY_PRICING_EUR.ENTERPRISE} EUR.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {SAAS_PLANS.map((entry) => {
          const features = getFeatureListForPlan(entry);
          const isCurrent = entry === currentPlan;
          return (
            <Card key={entry} className={isCurrent ? "border-primary/60 shadow-lg shadow-primary/10" : ""}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{entry}</CardTitle>
                  {isCurrent ? <Badge variant="success">Piano attivo</Badge> : null}
                </div>
                <p className="text-2xl font-semibold text-foreground">{PLAN_MONTHLY_PRICING_EUR[entry]} EUR/mese</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {features.map((feature) => (
                  <p key={`${entry}-${feature}`} className="text-sm text-foreground">
                    • {featureLabels[feature]}
                  </p>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tabella comparativa feature</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>STARTER</TableHead>
                <TableHead>PRO</TableHead>
                <TableHead>ENTERPRISE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedFeatures.map((feature) => (
                <TableRow key={feature}>
                  <TableCell>{featureLabels[feature]}</TableCell>
                  {SAAS_PLANS.map((entry) => (
                    <TableCell key={`${feature}-${entry}`}>
                      {getFeatureListForPlan(entry).includes(feature) ? (
                        <Badge variant="success">Inclusa</Badge>
                      ) : (
                        <Badge variant="secondary">-</Badge>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="text-sm text-muted-foreground">
            Per upgrade/downgrade piano contatta Platform Admin dalla Console Platform.
          </p>
          <Link
            to="/profilo"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95"
          >
            Contatta supporto / Profilo
          </Link>
        </CardContent>
      </Card>
    </section>
  );
};
