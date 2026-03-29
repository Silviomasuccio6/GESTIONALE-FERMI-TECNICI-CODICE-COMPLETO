import { Navigate } from "react-router-dom";
import { FeatureKey } from "../../domain/constants/entitlements";
import { useEntitlements } from "../hooks/use-entitlements";

type FeatureProtectedRouteProps = {
  feature: FeatureKey;
  children: JSX.Element;
};

export const FeatureProtectedRoute = ({ feature, children }: FeatureProtectedRouteProps) => {
  const { loading, can } = useEntitlements();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Verifica feature disponibili...</p>;
  }

  if (!can(feature)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
