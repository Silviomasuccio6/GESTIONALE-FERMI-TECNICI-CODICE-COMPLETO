const normalizeNoonUtc = (value: Date): Date => {
  const next = new Date(value);
  next.setUTCHours(12, 0, 0, 0);
  return next;
};

const addYearsUtc = (base: Date, years: number): Date => {
  const next = new Date(base);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
};

export const computeVehicleRevisionDueAt = (input: {
  registrationDate?: Date | null;
  lastRevisionAt?: Date | null;
  manualRevisionDueAt?: Date | null;
}): Date | null => {
  const registrationDate = input.registrationDate ? normalizeNoonUtc(input.registrationDate) : null;
  const lastRevisionAt = input.lastRevisionAt ? normalizeNoonUtc(input.lastRevisionAt) : null;
  const manualRevisionDueAt = input.manualRevisionDueAt ? normalizeNoonUtc(input.manualRevisionDueAt) : null;

  // Regola italiana richiesta:
  // - prima revisione a 4 anni dalla prima immatricolazione
  // - poi ogni 2 anni dall'ultima revisione effettuata
  if (lastRevisionAt) return addYearsUtc(lastRevisionAt, 2);
  if (registrationDate) return addYearsUtc(registrationDate, 4);
  return manualRevisionDueAt;
};
