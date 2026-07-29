import type { Metadata } from "next";
import { LegalPage } from "../../components/legal-page";
import { legalDocuments } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Termini e condizioni",
  description:
    "Termini e condizioni operative preliminari per l’utilizzo professionale del software SaaS Fleetum.",
  path: "/termini",
  index: false,
});

export default function TermsPage() {
  return <LegalPage document={legalDocuments.termini} />;
}
