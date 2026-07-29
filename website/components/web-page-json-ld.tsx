import { publicOrigin, publicPageUrl } from "../lib/site-data";
import { JsonLd } from "./json-ld";

type WebPageJsonLdProps = {
  name: string;
  description: string;
  path: `/${string}` | "/";
};

export function WebPageJsonLd({
  name,
  description,
  path,
}: WebPageJsonLdProps) {
  const url = publicPageUrl(path);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: "it-IT",
        isPartOf: { "@id": `${publicOrigin}/#website` },
        about: { "@id": `${publicOrigin}/#software` },
        publisher: { "@id": `${publicOrigin}/#organization` },
      }}
    />
  );
}
