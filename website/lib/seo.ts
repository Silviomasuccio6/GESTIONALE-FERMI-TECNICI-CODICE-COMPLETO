import type { Metadata } from "next";
import { isIndexable, publicOrigin } from "./site-data";

type MetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  index?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  index = true,
}: MetadataInput): Metadata {
  const url = `${publicOrigin}${path === "/" ? "" : path}`;
  const image = `${publicOrigin}/brand/fleetum-social-preview.png`;
  const shouldIndex = isIndexable && index;
  const shouldFollow = isIndexable;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: {
        index: shouldIndex,
        follow: shouldFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Fleetum",
      locale: "it_IT",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} — Fleetum`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
