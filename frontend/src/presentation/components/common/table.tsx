import { PropsWithChildren, ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { Badge as UiBadge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table as UiTable, TableCell, TableHead, TableRow } from "../ui/table";

export const Table = ({ children }: PropsWithChildren) => <UiTable>{children}</UiTable>;
export const Th = ({ children }: PropsWithChildren) => <TableHead>{children}</TableHead>;
export const Td = ({ children }: PropsWithChildren) => <TableCell>{children}</TableCell>;

export const Badge = ({ label, tone }: { label: string; tone?: "ok" | "warn" | "danger" | "neutral" }) => {
  const variant = tone === "ok" ? "success" : tone === "warn" ? "warning" : tone === "danger" ? "destructive" : "secondary";
  return <UiBadge variant={variant}>{label}</UiBadge>;
};

export const EmptyState = ({ title }: { title: string }) => (
  <Card className="border-dashed">
    <CardContent className="py-10 text-center text-sm text-muted-foreground">{title}</CardContent>
  </Card>
);

export const CardStat = ({
  title,
  value,
  extra,
  valueClassName
}: {
  title: string;
  value: string | number;
  extra?: ReactNode;
  valueClassName?: string;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className={cn("truncate whitespace-nowrap text-[clamp(1.5rem,2.8vw,1.95rem)] font-semibold tracking-tight", valueClassName)}>{value}</p>
      {extra}
    </CardContent>
  </Card>
);

export const Tr = ({ children }: PropsWithChildren) => <TableRow>{children}</TableRow>;
