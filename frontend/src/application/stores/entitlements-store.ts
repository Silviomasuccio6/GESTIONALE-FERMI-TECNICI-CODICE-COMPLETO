import { create } from "zustand";
import { FeatureKey, SaasPlan, ensureKnownPlan } from "../../domain/constants/entitlements";

type EntitlementsState = {
  plan: SaasPlan;
  priceMonthly: number;
  features: FeatureKey[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setEntitlements: (input: { plan: string; priceMonthly: number; features: string[] }) => void;
  setError: (message: string | null) => void;
  reset: () => void;
};

const initialState = {
  plan: "STARTER" as SaasPlan,
  priceMonthly: 49,
  features: [] as FeatureKey[],
  loading: false,
  loaded: false,
  error: null as string | null
};

export const useEntitlementsStore = create<EntitlementsState>((set) => ({
  ...initialState,
  setLoading: (loading) => set({ loading }),
  setEntitlements: ({ plan, priceMonthly, features }) =>
    set({
      plan: ensureKnownPlan(plan),
      priceMonthly: Number.isFinite(priceMonthly) && priceMonthly > 0 ? priceMonthly : 49,
      features: features.filter(Boolean) as FeatureKey[],
      loading: false,
      loaded: true,
      error: null
    }),
  setError: (message) => set({ error: message, loading: false, loaded: true }),
  reset: () => set({ ...initialState })
}));
