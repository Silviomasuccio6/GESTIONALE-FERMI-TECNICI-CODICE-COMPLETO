import { Badge } from "../ui/badge";

type Props = {
  action: string;
  tenantName: string;
  createdAt: string;
  actor: string;
  sourceIp: string;
  quickAction: string;
  timeAgo: string;
};

const actionTone = (action: string) => {
  if (action.includes("SUSPEND") || action.includes("DEACTIVATE")) return "destructive" as const;
  if (action.includes("ACTIVATE") || action.includes("RENEW")) return "success" as const;
  return "secondary" as const;
};

export const PlatformEventItem = ({ action, tenantName, createdAt, actor, sourceIp, quickAction, timeAgo }: Props) => {
  return (
    <div className="platform-event rounded-2xl border border-border/70 bg-muted/35 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={actionTone(action)}>{action}</Badge>
          <p className="font-semibold text-foreground">{tenantName}</p>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(createdAt).toLocaleString("it-IT")} · actor: {actor} · IP: {sourceIp}
      </p>
      {quickAction ? <p className="mt-1 text-xs text-muted-foreground">quickAction: {quickAction}</p> : null}
    </div>
  );
};
