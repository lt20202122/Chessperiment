import type { Metadata } from 'next';
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');


// app/announcements/page.tsx
export const metadata: Metadata = {
    title: 'ChessPie Announcements',
    description: 'Latest news and updates about ChessPie.',
    openGraph: {
        title: 'ChessPie Announcements',
        description: 'Latest news and updates about ChessPie.',
        url: 'https://chesspie.de/announcements',
        siteName: 'ChessPie',
        images: ['/og-announcements.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ChessPie Announcements',
        description: 'Latest news and updates about ChessPie.',
        images: ['/og-announcements.png'],
    },
    alternates: {
        canonical: "https://chesspie.de/announcements", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
};

const jsonLd_announcementsIndex = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ChessPie Announcements",
    "description": "Latest updates, release notes and events from ChessPie.",
    "url": "https://chesspie.de/announcements"
};

export default function Announcements() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_announcementsIndex).replace(/</g, '\\u003c') }}
        />
    </>
}