import { Badge } from "../common/table";
import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";

export const StoppageStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
    OPEN: "warn",
    IN_PROGRESS: "warn",
    WAITING_PARTS: "neutral",
    SOLICITED: "danger",
    CLOSED: "ok",
    CANCELED: "neutral"
  };
  return <Badge label={stoppageStatusLabel[status] ?? status} tone={map[status] ?? "neutral"} />;
};
