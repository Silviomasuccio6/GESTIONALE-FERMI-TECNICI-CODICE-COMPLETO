import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";
import { landingPages } from "../../lib/landing-pages";
import { buildMetadata } from "../../lib/seo";

const page = landingPages["gestionale-flotta"];

export const metadata: Metadata = buildMetadata({
  title: "Gestionale flotta per autonoleggio",
  description: page.description,
  path: "/gestionale-flotta",
});

export default function FleetManagementPage() {
  return <SeoLandingPage page={page} />;
}
