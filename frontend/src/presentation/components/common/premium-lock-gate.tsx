import { ReactNode } from "react";
import { Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { FeatureKey, SaasPlan } from "../../../domain/constants/entitlements";
import { cn } from "../../../lib/utils";
import { useEntitlements } from "../../hooks/use-entitlements";

type PremiumLockGateProps = {
  feature: FeatureKey;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  title?: string;
  description?: string;
  locked?: boolean;
  requiredPlanOverride?: SaasPlan | null;
  overlayPlacement?: "center" | "top-center";
};

export const PremiumLockGate = ({
  feature,
  children,
  className,
  compact = false,
  title,
  description,
  locked,
  requiredPlanOverride,
  overlayPlacement = "center"
}: PremiumLockGateProps) => {
  const { can, requiredPlan, loading, loaded } = useEntitlements();

  const explicitLock = typeof locked === "boolean";
  const isLocked = explicitLock ? locked : !can(feature);

  // Avoid lock flicker only when lock state is inferred internally.
  if (!explicitLock && !loaded && loading) {
    return <>{children}</>;
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  const plan = requiredPlanOverride ?? requiredPlan(feature) ?? "PRO";
  const ctaLabel = plan === "ENTERPRISE" ? "PASSA A PIANO ENTERPRISE" : "PASSA A PRO";

  return (
    <div className={cn("relative isolate", className)}>
      <div aria-hidden className="pointer-events-none select-none blur-[1.3px] saturate-[0.9] opacity-64">
        {children}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20",
          compact
            ? "flex items-center justify-center p-3"
            : overlayPlacement === "top-center"
              ? "flex items-start justify-center p-4 pt-4 sm:pt-5"
              : "flex items-center justify-center p-4"
        )}
      >
        <div
          className={cn(
            "pointer-events-auto w-full rounded-2xl border border-indigo-300/55 bg-card/94 text-center backdrop-blur-md",
            compact ? "max-w-[300px] p-3 shadow-lg" : "max-w-[460px] p-5 shadow-xl"
          )}
        >
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
            <Lock className="h-4 w-4" />
          </div>

          <p className={cn("mt-2 font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
            {title ?? "Feature premium bloccata"}
          </p>
          <p className={cn("mt-1 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {description ?? `Questa funzionalità richiede il piano ${plan}.`}
          </p>

          <Link
            to="/upgrade"
            className={cn(
              "mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 font-semibold text-white outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-300",
              "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600",
              "shadow-[0_10px_28px_rgba(67,56,202,0.38)] hover:brightness-110 hover:shadow-[0_14px_34px_rgba(67,56,202,0.46)]",
              compact ? "h-9 text-xs" : "h-10 text-sm"
            )}
          >
            <Crown className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};
