import assert from "node:assert/strict";
import test from "node:test";
import {
  addMinimumRentalDuration,
  hasMinimumRentalDuration,
  MINIMUM_RENTAL_DURATION_MS,
  rentalDurationLabel
} from "../src/domain/rental-booking-duration";

const pickupAt = new Date("2026-08-10T08:00:00.000Z");

test("new rental defaults to exactly 24 hours", () => {
  const returnAt = addMinimumRentalDuration(pickupAt);

  assert.equal(returnAt.getTime() - pickupAt.getTime(), MINIMUM_RENTAL_DURATION_MS);
  assert.equal(hasMinimumRentalDuration(pickupAt, returnAt), true);
  assert.equal(rentalDurationLabel(pickupAt, returnAt), "1 giorno · 24 ore");
});

test("duration validation rejects 23:59:59.999 and accepts exactly 24 hours", () => {
  const tooShort = new Date(pickupAt.getTime() + MINIMUM_RENTAL_DURATION_MS - 1);
  const exact = new Date(pickupAt.getTime() + MINIMUM_RENTAL_DURATION_MS);

  assert.equal(hasMinimumRentalDuration(pickupAt, tooShort), false);
  assert.equal(hasMinimumRentalDuration(pickupAt, exact), true);
});

test("duration label remains clear for multi-day and partial-day rentals", () => {
  const thirtySixHours = new Date(pickupAt.getTime() + 36 * 60 * 60 * 1000);

  assert.equal(rentalDurationLabel(pickupAt, thirtySixHours), "2 giorni · 36 ore");
});
