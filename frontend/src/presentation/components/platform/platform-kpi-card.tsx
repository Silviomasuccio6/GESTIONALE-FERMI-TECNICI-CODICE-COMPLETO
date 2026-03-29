import { ReactNode } from "react";
import { Card, CardContent } from "../ui/card";

type Props = {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  valueClassName?: string;
};

export const PlatformKpiCard = ({ title, value, subtitle, icon, valueClassName }: Props) => {
  return (
    <Card className="platform-stat-card h-full">
      <CardContent className="flex h-full flex-col justify-center gap-2 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
        <p className={`platform-kpi-metric ${valueClassName ?? "text-foreground"}`}>
          <span className="platform-kpi-icon" aria-hidden="true">{icon}</span>
          <span>{value}</span>
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};
