import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";

export const StoppageStatusBadge = ({ status }: { status: string }) => {
  const toneMap: Record<string, string> = {
    OPEN: "is-open",
    IN_PROGRESS: "is-progress",
    WAITING_PARTS: "is-waiting",
    SOLICITED: "is-solicited",
    CLOSED: "is-closed",
    CANCELED: "is-canceled"
  };

  return (
    <span className={`stoppage-status-pill ${toneMap[status] ?? "is-neutral"}`}>
      <span className="stoppage-status-dot" />
      <span>{stoppageStatusLabel[status] ?? status}</span>
    </span>
  );
};
