import Btn from "./Buttons"
import type { Metadata } from "next";
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

export const metadata: Metadata = {
  title: "ChessPie – Eigene Schachbretter und Figuren erstellen",
  description: "ChessPie: Erstelle eigene Schachbretter, Figuren und Spiele. Spiele online mit Freunden oder teste neue Regeln.",
  alternates: {
    canonical: "https://chesspie.de/",
    languages: hreflangs.reduce((acc, tag) => {
      acc[tag.hrefLang] = tag.href;
      return acc;
    }, {} as Record<string, string>),
  },
  openGraph: {
    title: "ChessPie – Eigene Schachbretter und Figuren erstellen",
    description: "ChessPie: Erstelle eigene Schachbretter, Figuren und Spiele. Spiele online mit Freunden oder teste neue Regeln.",
    url: "https://chesspie.de/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChessPie – Eigene Schachbretter und Figuren erstellen",
    description: "ChessPie: Erstelle eigene Schachbretter, Figuren und Spiele. Spiele online mit Freunden oder teste neue Regeln.",
  },
};

const jsonLd_home = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://chesspie.de/#website",
      "url": "https://chesspie.de/",
      "name": "ChessPie",
      "description": "Create custom chess boards, pieces and rules — play and share your creations.",
      "inLanguage": "en"
    },
    {
      "@type": "Organization",
      "@id": "https://chesspie.de/#organization",
      "name": "ChessPie",
      "url": "https://chesspie.de/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chesspie.de/static/logo.svg"
      },
      "sameAs": [
        "https://twitter.com/chesspie",
        "https://instagram.com/chesspie"
      ]
    }
  ]
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_home).replace(/</g, '\\u003c') }}
      />
      <Btn />
    </>
  );
}