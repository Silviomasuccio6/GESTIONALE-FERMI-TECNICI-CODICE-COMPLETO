export const MINIMUM_RENTAL_DURATION_HOURS = 24;
export const MINIMUM_RENTAL_DURATION_MS = MINIMUM_RENTAL_DURATION_HOURS * 60 * 60 * 1000;
export const MINIMUM_RENTAL_DURATION_MESSAGE = "La durata minima del noleggio e di 24 ore.";

const validDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addMinimumRentalDuration = (pickupAt: Date) =>
  new Date(pickupAt.getTime() + MINIMUM_RENTAL_DURATION_MS);

export const hasMinimumRentalDuration = (pickupAt: Date | string, returnAt: Date | string) => {
  const pickup = validDate(pickupAt);
  const returned = validDate(returnAt);
  if (!pickup || !returned) return false;
  return returned.getTime() - pickup.getTime() >= MINIMUM_RENTAL_DURATION_MS;
};

export const rentalDurationLabel = (pickupAt: Date | string, returnAt: Date | string) => {
  const pickup = validDate(pickupAt);
  const returned = validDate(returnAt);
  if (!pickup || !returned || returned.getTime() <= pickup.getTime()) return null;

  const totalMinutes = Math.round((returned.getTime() - pickup.getTime()) / 60000);
  const totalHours = totalMinutes / 60;
  const billableDays = Math.max(1, Math.ceil(totalMinutes / (24 * 60)));
  const hoursLabel = Number.isInteger(totalHours)
    ? String(totalHours)
    : new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(totalHours);

  return `${billableDays} ${billableDays === 1 ? "giorno" : "giorni"} · ${hoursLabel} ore`;
};
