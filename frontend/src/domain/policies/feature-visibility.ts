import type { FeatureKey } from "../constants/entitlements";

export type FeatureVisibilityNode = {
  feature?: FeatureKey;
  children?: FeatureVisibilityNode[];
};

export const filterFeatureVisibleItems = <T extends FeatureVisibilityNode>(
  items: readonly T[],
  entitlementsLoaded: boolean,
  can: (feature: FeatureKey) => boolean
): T[] =>
  items.flatMap((item) => {
    if (item.feature && (!entitlementsLoaded || !can(item.feature))) {
      return [];
    }

    if (!item.children) {
      return [item];
    }

    const children = filterFeatureVisibleItems(item.children, entitlementsLoaded, can);
    if (children.length === 0) {
      return [];
    }

    return [{ ...item, children } as T];
  });

const APP_ROUTE_FEATURE_RULES: ReadonlyArray<{ prefix: string; feature: FeatureKey }> = [
  { prefix: "/statistiche", feature: "reports_advanced" }
];

export const getRequiredFeatureForAppPath = (pathname: string): FeatureKey | null =>
  APP_ROUTE_FEATURE_RULES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.feature ?? null;
