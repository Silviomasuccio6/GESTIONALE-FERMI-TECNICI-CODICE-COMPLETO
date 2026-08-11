import { AppError } from "../errors/app-error.js";

export const MINIMUM_RENTAL_DURATION_HOURS = 24;
export const MINIMUM_RENTAL_DURATION_MS = MINIMUM_RENTAL_DURATION_HOURS * 60 * 60 * 1000;

export const hasMinimumRentalDuration = (pickupAt: Date, returnAt: Date) =>
  returnAt.getTime() - pickupAt.getTime() >= MINIMUM_RENTAL_DURATION_MS;

export const assertMinimumRentalDuration = (pickupAt: Date, returnAt: Date) => {
  if (hasMinimumRentalDuration(pickupAt, returnAt)) return;

  throw new AppError(
    "La durata minima del noleggio e di 24 ore.",
    422,
    "RENTAL_MINIMUM_DURATION",
    { minimumHours: MINIMUM_RENTAL_DURATION_HOURS }
  );
};
