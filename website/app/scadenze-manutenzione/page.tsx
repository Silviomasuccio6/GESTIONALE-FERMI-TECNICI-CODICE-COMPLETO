import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";
import { landingPages } from "../../lib/landing-pages";
import { buildMetadata } from "../../lib/seo";

const page = landingPages["scadenze-manutenzione"];

export const metadata: Metadata = buildMetadata({
  title: "Scadenze e manutenzione flotta",
  description: page.description,
  path: "/scadenze-manutenzione",
});

export default function FleetMaintenancePage() {
  return <SeoLandingPage page={page} />;
}
