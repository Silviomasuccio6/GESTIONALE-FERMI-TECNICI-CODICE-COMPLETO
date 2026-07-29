import type { Metadata } from "next";
import { LegalPage } from "../../components/legal-page";
import { legalDocuments } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Data Processing Agreement",
  description:
    "Schema operativo Fleetum per il trattamento dei dati tra cliente SaaS e fornitore.",
  path: "/dpa",
  index: false,
});

export default function DpaPage() {
  return <LegalPage document={legalDocuments.dpa} />;
}
