import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";
import { landingPages } from "../../lib/landing-pages";
import { buildMetadata } from "../../lib/seo";

const page = landingPages["booking-noleggi"];

export const metadata: Metadata = buildMetadata({
  title: "Booking noleggi e planner flotta",
  description: page.description,
  path: "/booking-noleggi",
});

export default function BookingRentalsPage() {
  return <SeoLandingPage page={page} />;
}
