import type { Metadata } from "next";
import { LegalPage } from "../../components/legal-page";
import { legalDocuments } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description:
    "Cookie necessari e analytics first-party del sito Fleetum, con strumenti marketing non attivi e consenso gestito nel browser.",
  path: "/cookie",
  index: false,
});

export default function CookiePage() {
  return <LegalPage document={legalDocuments.cookie} />;
}
