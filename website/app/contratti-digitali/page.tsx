import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";
import { landingPages } from "../../lib/landing-pages";
import { buildMetadata } from "../../lib/seo";

const page = landingPages["contratti-digitali"];

export const metadata: Metadata = buildMetadata({
  title: "Contratti digitali per autonoleggio",
  description: page.description,
  path: "/contratti-digitali",
});

export default function DigitalContractsPage() {
  return <SeoLandingPage page={page} />;
}
