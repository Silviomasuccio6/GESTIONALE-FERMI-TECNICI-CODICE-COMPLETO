export const stoppageStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    OPEN: "Aperto",
    IN_PROGRESS: "In lavorazione",
    WAITING_PARTS: "In attesa ricambi",
    SOLICITED: "Sollecitato",
    CLOSED: "Chiuso",
    CANCELED: "Annullato"
  };
  return map[status] ?? status;
};
