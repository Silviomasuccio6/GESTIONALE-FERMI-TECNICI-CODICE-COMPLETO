import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";
import { landingPages } from "../../lib/landing-pages";
import { buildMetadata } from "../../lib/seo";

const page = landingPages["come-funziona"];

export const metadata: Metadata = buildMetadata({
  title: "Come funziona Fleetum",
  description: page.description,
  path: "/come-funziona",
});

export default function HowFleetumWorksPage() {
  return <SeoLandingPage page={page} />;
}
