import { useCallback, useEffect } from "react";
import { useAuthStore } from "../../application/stores/auth-store";
import { useEntitlementsStore } from "../../application/stores/entitlements-store";
import { authUseCases } from "../../application/usecases/auth-usecases";
import { FeatureKey, getRequiredPlanForFeature, hasFeature } from "../../domain/constants/entitlements";

export const useEntitlements = () => {
  const token = useAuthStore((state) => state.token);
  const { plan, priceMonthly, features, loading, loaded, error, setLoading, setEntitlements, setError, reset } = useEntitlementsStore();

  useEffect(() => {
    if (!token) {
      reset();
      return;
    }

    if (loaded || loading) return;

    let active = true;
    setLoading(true);

    authUseCases
      .entitlements()
      .then((data) => {
        if (!active) return;
        setEntitlements({
          plan: data.plan,
          priceMonthly: data.priceMonthly,
          features: data.features ?? []
        });
      })
      .catch((err) => {
        if (!active) return;
        setError((err as Error).message);
      });

    return () => {
      active = false;
    };
  }, [token, loaded, loading, reset, setEntitlements, setError, setLoading]);

  const can = useCallback((feature: FeatureKey) => hasFeature(plan, feature), [plan]);
  const requiredPlan = useCallback((feature: FeatureKey) => getRequiredPlanForFeature(feature), []);

  return {
    plan,
    priceMonthly,
    features,
    can,
    requiredPlan,
    loading,
    loaded,
    error
  };
};
