export const stoppageStatusLabel: Record<string, string> = {
  OPEN: "Aperto",
  IN_PROGRESS: "In lavorazione",
  WAITING_PARTS: "In attesa ricambi",
  SOLICITED: "Sollecitato",
  CLOSED: "Chiuso",
  CANCELED: "Annullato"
};

export const stoppageStatusOptions = [
  { value: "OPEN", label: "Aperto" },
  { value: "IN_PROGRESS", label: "In lavorazione" },
  { value: "WAITING_PARTS", label: "In attesa ricambi" },
  { value: "SOLICITED", label: "Sollecitato" },
  { value: "CLOSED", label: "Chiuso" },
  { value: "CANCELED", label: "Annullato" }
] as const;
