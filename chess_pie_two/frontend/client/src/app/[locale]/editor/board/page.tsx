import PageClient from "./PageClient";
import type { Metadata } from "next"
import { generateHreflangs } from '@/lib/hreflang';

export const metadata: Metadata = {
    title: "ChessPie | Custom Board Editor",
    description: "Design unique chess boards with custom colors, zones, and layouts. The best free online chess board creator.",
    alternates: {
        canonical: "https://chesspie.org/editor/board",
    },
    openGraph: {
        title: "ChessPie | Custom Board Editor",
        description: "Design unique chess boards with custom colors, zones, and layouts.",
        url: "https://chesspie.org/editor/board",
        type: "website",
        images: [{ url: "/images/seo/og-editor.png", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "ChessPie | Custom Board Editor",
        description: "Design unique chess boards with custom colors, zones, and layouts.",
        images: ["/images/seo/twitter-image.png"],
    },
};

const jsonLd_boardEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Board Editor",
    "url": "https://chesspie.org/editor/board",
    "description": "An editor to design custom chess boards on ChessPie. Create grids, zones and custom layouts.",
    "applicationCategory": "DesignApplication",
    "provider": { "@type": "Organization", "name": "ChessPie", "url": "https://chesspie.org" },
    "featureList": [
        "Grid editor",
        "Tile coloring",
        "Custom starting positions",
        "Export / Share"
    ]
};

export default function Board() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_boardEditor).replace(/</g, '\\u003c') }}
        />
        <PageClient /></>


}