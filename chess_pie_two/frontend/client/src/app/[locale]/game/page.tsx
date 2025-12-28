import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.org');
import LobbyPage from "./LobbyPage"
import type { Metadata } from "next"

// app/game/page.tsx
const jsonLd_gameIndex = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ChessPie – Games",
    "description": "Browse public ChessPie games and variants created by users.",
    "url": "https://chesspie.org/game",
    "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chesspie.org/" },
            { "@type": "ListItem", "position": 2, "name": "Games", "item": "https://chesspie.org/game" }
        ]
    }
};

export const metadata: Metadata = {
    title: 'Play ChessPie Games',
    description: 'Play custom chess boards and figures on ChessPie.',
    openGraph: {
        title: 'Play ChessPie Games',
        description: 'Play custom chess boards and figures on ChessPie.',
        url: 'https://chesspie.org/game',
        siteName: 'ChessPie',
        images: [{ url: '/images/seo/og-game.png', width: 1200, height: 630 }],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Play ChessPie Games',
        description: 'Play custom chess boards and figures on ChessPie.',
        images: ['/images/seo/twitter-image.png'],
    },
    alternates: {
        canonical: "https://chesspie.org/game",
    },
};

export default function Game() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_gameIndex).replace(/</g, '\\u003c') }}
        />
        <LobbyPage />
    </>

}