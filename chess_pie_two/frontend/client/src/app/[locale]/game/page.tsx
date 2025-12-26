import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');
import Board from "./Board"
import type { Metadata } from "next"

// app/game/page.tsx
export const metadata: Metadata = {
    title: 'Play ChessPie Games',
    description: 'Play custom chess boards and figures on ChessPie.',
    openGraph: {
        title: 'Play ChessPie Games',
        description: 'Play custom chess boards and figures on ChessPie.',
        url: 'https://chesspie.de/game',
        siteName: 'ChessPie',
        images: ['/og-game.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Play ChessPie Games',
        description: 'Play custom chess boards and figures on ChessPie.',
        images: ['/og-game.png'],
    },
    alternates: {
        canonical: "https://chesspie.de/game", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
};

const jsonLd_gameIndex = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ChessPie – Games",
    "description": "Browse public ChessPie games and variants created by users.",
    "url": "https://chesspie.de/game",
    "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chesspie.de/" },
            { "@type": "ListItem", "position": 2, "name": "Games", "item": "https://chesspie.de/game" }
        ]
    }
};

export default function Game() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_gameIndex).replace(/</g, '\\u003c') }}
        />
        <Board />
    </>

}