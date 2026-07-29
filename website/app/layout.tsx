import type { Metadata, Viewport } from "next";
import { CookiePreferences } from "../components/cookie-preferences";
import { JsonLd } from "../components/json-ld";
import { PublicAnalytics } from "../components/public-analytics";
import { isIndexable, publicOrigin } from "../lib/site-data";
import "./globals.css";

const title = "Fleetum — Il sistema operativo per autonoleggi moderni";
const description =
  "Fleetum collega booking, contratti digitali, clienti, veicoli, manutenzioni, scadenze e KPI in un'unica control room.";

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5f9fd",
};

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: {
    default: title,
    template: "%s | Fleetum",
  },
  description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: isIndexable,
    follow: isIndexable,
    googleBot: {
      index: isIndexable,
      follow: isIndexable,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/brand/fleetum-favicon-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/brand/fleetum-favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/brand/fleetum-favicon-light.png",
    apple: "/brand/fleetum-apple-touch-icon.png",
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: `${publicOrigin}/brand/fleetum-social-preview.png`,
        width: 1200,
        height: 630,
        alt: "Fleetum — Il sistema operativo per autonoleggi moderni",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${publicOrigin}/brand/fleetum-social-preview.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${publicOrigin}/#organization`,
                name: "Fleetum",
                url: publicOrigin,
                logo: `${publicOrigin}/brand/fleetum-logo-on-light.webp`,
              },
              {
                "@type": "WebSite",
                "@id": `${publicOrigin}/#website`,
                url: publicOrigin,
                name: "Fleetum",
                inLanguage: "it-IT",
                publisher: { "@id": `${publicOrigin}/#organization` },
              },
            ],
          }}
        />
        {children}
        <PublicAnalytics />
        <CookiePreferences />
      </body>
    </html>
  );
}
