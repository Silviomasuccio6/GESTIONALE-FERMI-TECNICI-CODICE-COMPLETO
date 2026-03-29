export type SlaPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const defaultThresholds: Record<SlaPriority, number> = {
  LOW: 15,
  MEDIUM: 10,
  HIGH: 5,
  CRITICAL: 2
};

export const getSlaThresholds = (): Record<SlaPriority, number> => {
  const raw = process.env.SLA_PRIORITY_THRESHOLDS;
  if (!raw) return defaultThresholds;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<SlaPriority, number>>;
    return {
      LOW: Number(parsed.LOW ?? defaultThresholds.LOW),
      MEDIUM: Number(parsed.MEDIUM ?? defaultThresholds.MEDIUM),
      HIGH: Number(parsed.HIGH ?? defaultThresholds.HIGH),
      CRITICAL: Number(parsed.CRITICAL ?? defaultThresholds.CRITICAL)
    };
  } catch {
    return defaultThresholds;
  }
};

export const getSlaThresholdForPriority = (priority?: string | null) => {
  const thresholds = getSlaThresholds();
  const key = (priority ?? "MEDIUM") as SlaPriority;
  return thresholds[key] ?? thresholds.MEDIUM;
};
