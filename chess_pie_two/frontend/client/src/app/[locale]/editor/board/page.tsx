import PageClient from "./PageClient";
import type { Metadata } from "next"
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');


// app/editor/board/page.tsx

export const metadata: Metadata = {
    title: "ChessPie – Spiele deine eigenen Schachbretter",
    description: "Erstelle eigene Schachbretter, Figuren und Spiele auf ChessPie.de",
    alternates: {
        canonical: "https://chesspie.de/game",
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
    openGraph: {
        title: "ChessPie – Spiele deine eigenen Schachbretter",
        description: "Erstelle eigene Schachbretter, Figuren und Spiele auf ChessPie.de",
        url: "https://chesspie.de/game",
        type: "website"
    },
    twitter: {
        card: "summary_large_image",
        title: "ChessPie – Spiele deine eigenen Schachbretter",
        description: "Erstelle eigene Schachbretter, Figuren und Spiele auf ChessPie.de"
    },
};


const jsonLd_boardEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Board Editor",
    "url": "https://chesspie.de/editor/board",
    "description": "An editor to design custom chess boards on ChessPie. Create grids, zones and custom layouts.",
    "applicationCategory": "DesignApplication",
    "provider": { "@type": "Organization", "name": "ChessPie", "url": "https://chesspie.de" },
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