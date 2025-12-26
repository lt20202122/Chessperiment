// app/marketplace/page.tsx
import type { Metadata } from "next";
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

export const metadata: Metadata = {
    title: 'ChessPie Marketplace',
    description: 'Explore and buy custom chess boards and pieces.',
    openGraph: {
        title: 'ChessPie Marketplace',
        description: 'Explore and buy custom chess boards and pieces.',
        url: 'https://chesspie.de/marketplace',
        siteName: 'ChessPie',
        images: ['/og-marketplace.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ChessPie Marketplace',
        description: 'Explore and buy custom chess boards and pieces.',
        images: ['/og-marketplace.png'],
    },
    alternates: {
        canonical: "https://chesspie.de/marketplace", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
};
const jsonLd_marketplaceIndex = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ChessPie Marketplace",
    "description": "Discover and buy custom boards, pieces and rules on ChessPie.",
    "url": "https://chesspie.de/marketplace"
    // optionally include itemListElement with products if you want
};

export default function Marketplace() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_marketplaceIndex).replace(/</g, '\\u003c') }}
        />
    </>
}