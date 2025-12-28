import PageClient from "./PageClient";
import type { Metadata } from "next";
const jsonLd_pieceEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Piece Editor",
    "url": "https://chesspie.org/editor/piece",
    "description": "Design and customize chess pieces — shapes, colors, and animations.",
    "applicationCategory": "DesignApplication",
    "provider": { "@type": "Organization", "name": "ChessPie", "url": "https://chesspie.org" }
};

export const metadata: Metadata = {
    title: "ChessPie | Custom Piece Editor",
    description: "Design your own chess pieces from scratch. Pixel art editor for custom chess variants.",
    alternates: {
        canonical: "https://chesspie.org/editor/piece",
    },
    openGraph: {
        title: "ChessPie | Custom Piece Editor",
        description: "Design your own chess pieces from scratch. Pixel art editor for custom chess variants.",
        url: "https://chesspie.org/editor/piece",
        siteName: "ChessPie",
        images: [{ url: "/images/seo/og-editor.png", width: 1200, height: 630 }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ChessPie | Custom Piece Editor",
        description: "Design unique chess pieces for your variants.",
        images: ["/images/seo/twitter-image.png"],
    },
};
export default function PiecePage() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_pieceEditor).replace(/</g, '\\u003c') }}
        />
        <PageClient />
    </>
}