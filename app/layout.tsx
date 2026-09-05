import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";

const brandFont = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-brand",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://undangan.co").replace(/\/+$/, "");

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Undangan Studio - Editor Undangan Digital No. 1 di Indonesia",
    template: "%s | Undangan Studio",
  },
  description:
    "Satu-satunya editor undangan digital No. 1 di Indonesia. Buat undangan pernikahan, wisuda & khitanan modern secara realtime. Cepat, elegan & mudah dibagikan.",
  keywords: [
    "editor undangan digital",
    "undangan digital no 1 di indonesia",
    "satu satunya editor undangan",
    "buat undangan digital",
    "undangan pernikahan digital",
    "undangan website online",
    "aplikasi pembuat undangan",
    "template undangan pernikahan",
    "undangan wisuda online",
    "undangan khitanan digital",
    "undangan online murah elegan",
    "undangan studio",
  ],
  authors: [{ name: "Undangan Studio" }],
  creator: "Undangan Studio",
  publisher: "Undangan Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Undangan Studio - Editor Undangan Digital No. 1 di Indonesia",
    description:
      "Satu-satunya platform & editor undangan digital No. 1 di Indonesia dengan kolaborasi realtime. Desain undangan pernikahan & momen berharga Anda dengan elegan.",
    url: siteUrl,
    siteName: "Undangan Studio",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/assets/editor-mockup.png",
        width: 1200,
        height: 630,
        alt: "Undangan Studio - Editor Undangan Digital No. 1 di Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Undangan Studio - Editor Undangan Digital No. 1 di Indonesia",
    description:
      "Satu-satunya editor undangan digital No. 1 di Indonesia. Visual realtime, kolaboratif & siap dibagikan.",
    images: ["/assets/editor-mockup.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/assets/fav.png",
    shortcut: "/assets/fav.png",
    apple: "/assets/fav.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Undangan Studio",
      description: "Editor Undangan Digital No. 1 di Indonesia",
      inLanguage: "id-ID",
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#application`,
      name: "Undangan Studio",
      applicationCategory: "DesignApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description:
        "Satu-satunya platform & editor undangan digital modular dengan kolaborasi realtime No. 1 di Indonesia.",
      url: siteUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IDR",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1280",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Undangan Studio",
      url: siteUrl,
      logo: `${siteUrl}/assets/fav.png`,
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={brandFont.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
