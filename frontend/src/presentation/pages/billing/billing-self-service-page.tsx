import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useEntitlements } from "../../hooks/use-entitlements";
import { FleetumFullScreenLoader } from "../../components/brand/fleetum-logo-loader";
import { PlanUpgradePage } from "../profile/plan-upgrade-page";

export const BillingSelfServicePage = () => {
  const { licenseStatus, loaded } = useEntitlements();
  const hasActiveSubscription = licenseStatus === "ACTIVE" || licenseStatus === "TRIAL";

  if (!loaded) {
    return <FleetumFullScreenLoader label="Verifica abbonamento" />;
  }

  if (licenseStatus === "PAST_DUE" || licenseStatus === "SUSPENDED") {
    return <Navigate to="/billing/recovery" replace />;
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/activate?billing=required" replace />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7fb] px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 pb-5">
        <Link
          to="/dashboard"
          aria-label="Torna alla dashboard del gestionale"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Torna al gestionale
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-blue-700 md:inline-flex dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            Billing sicuro Stripe
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <PlanUpgradePage mode="upgrade" />
      </div>
    </main>
  );
};
