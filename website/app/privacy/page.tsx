import type { Metadata } from "next";
import { LegalPage } from "../../components/legal-page";
import { legalDocuments } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Informativa operativa sul trattamento dei dati, i ruoli privacy e la conservazione prevista nel servizio Fleetum.",
  path: "/privacy",
  index: false,
});

export default function PrivacyPage() {
  return <LegalPage document={legalDocuments.privacy} />;
}
