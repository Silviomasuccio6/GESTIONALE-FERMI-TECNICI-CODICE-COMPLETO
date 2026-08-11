import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMinimumRentalDuration,
  hasMinimumRentalDuration,
  MINIMUM_RENTAL_DURATION_MS
} from "../src/shared/validation/rental-booking-duration.js";
import {
  rentalBookingCreateSchema,
  rentalPricingQuoteSchema
} from "../src/interfaces/http/validators/rental-bookings-validators.js";
import { AppError } from "../src/shared/errors/app-error.js";

const pickupAt = new Date("2026-08-10T08:00:00.000Z");

test("rental duration rejects any interval shorter than 24 hours", () => {
  const returnAt = new Date(pickupAt.getTime() + MINIMUM_RENTAL_DURATION_MS - 1);

  assert.equal(hasMinimumRentalDuration(pickupAt, returnAt), false);
  assert.throws(
    () => assertMinimumRentalDuration(pickupAt, returnAt),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 422);
      assert.equal(error.code, "RENTAL_MINIMUM_DURATION");
      return true;
    }
  );
});

test("rental duration accepts exactly 24 hours and longer rentals", () => {
  const exactReturnAt = new Date(pickupAt.getTime() + MINIMUM_RENTAL_DURATION_MS);
  const multiDayReturnAt = new Date(pickupAt.getTime() + MINIMUM_RENTAL_DURATION_MS * 3);

  assert.equal(hasMinimumRentalDuration(pickupAt, exactReturnAt), true);
  assert.equal(hasMinimumRentalDuration(pickupAt, multiDayReturnAt), true);
  assert.doesNotThrow(() => assertMinimumRentalDuration(pickupAt, exactReturnAt));
});

test("booking and pricing validators fail fast below the 24-hour minimum", () => {
  const returnAt = new Date(pickupAt.getTime() + 23 * 60 * 60 * 1000);
  const booking = rentalBookingCreateSchema.safeParse({
    vehicleId: "vehicle_1",
    customerId: "customer_1",
    pickupAt,
    returnAt
  });
  const quote = rentalPricingQuoteSchema.safeParse({
    priceListId: "price_list_1",
    pickupAt,
    returnAt
  });

  assert.equal(booking.success, false);
  assert.equal(quote.success, false);
  if (!booking.success) assert.match(booking.error.issues[0]?.message ?? "", /24 ore/i);
  if (!quote.success) assert.match(quote.error.issues[0]?.message ?? "", /24 ore/i);
});
