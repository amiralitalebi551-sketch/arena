import type { Metadata, Viewport } from "next";
import { display, body } from "@/lib/fonts";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: `${site.name} — Specialized AI agent teams for media & branding`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "multi-agent",
    "AI agents",
    "branding",
    "media",
    "creative studio",
    "FarBoo",
  ],
  authors: [{ name: site.name }],
  alternates: { canonical: site.domain },
  openGraph: {
    type: "website",
    url: site.domain,
    title: `${site.name} — Intelligence, Orchestrated`,
    description: site.description,
    siteName: site.name,
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Intelligence, Orchestrated`,
    description: site.description,
    images: ["/og.svg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0B14",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: site.description,
  url: site.domain,
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: site.name,
    url: site.domain,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
