import Btn from "./Buttons"
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ChessPie | Custom Chess Board & Piece Creator",
  description: "Create your own chess world. Design pieces, boards and rules. Play unique chess variants online with friends on ChessPie.",
  alternates: {
    canonical: "https://chesspie.org",
  },
  openGraph: {
    title: "ChessPie | Custom Chess Board & Piece Creator",
    description: "Create your own chess world. Design pieces, boards and rules. Play unique chess variants online.",
    url: "https://chesspie.org",
    type: "website",
    images: [{ url: "/images/seo/og-home.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChessPie | Custom Chess Board & Piece Creator",
    description: "Create your own chess world. Design pieces, boards and rules. Play unique chess variants online.",
    images: ["/images/seo/twitter-image.png"],
  },
};

const jsonLd_home = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://chesspie.org/#website",
      "url": "https://chesspie.org/",
      "name": "ChessPie",
      "description": "The ultimate platform for custom chess creation and play.",
      "inLanguage": "en"
    },
    {
      "@type": "Organization",
      "@id": "https://chesspie.org/#organization",
      "name": "ChessPie",
      "url": "https://chesspie.org/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chesspie.org/icon.png"
      },
      "sameAs": [] // Populate when social links exist
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