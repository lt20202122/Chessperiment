import PageClient from "./PageClient";
const jsonLd_pieceEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Piece Editor",
    "url": "https://chesspie.de/editor/piece",
    "description": "Design and customize chess pieces — shapes, colors, and animations.",
    "applicationCategory": "DesignApplication",
    "provider": { "@type": "Organization", "name": "ChessPie" }
};
import type { Metadata } from "next"
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

export const metadata: Metadata = {
    title: 'Chess Piece Editor',
    description: 'Design your own chess pieces for ChessPie games.',
    openGraph: {
        title: 'Chess Piece Editor',
        description: 'Design your own chess pieces for ChessPie games.',
        url: 'https://chesspie.de/editor/piece',
        siteName: 'ChessPie',
        images: ['/og-piece-editor.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Chess Piece Editor',
        description: 'Design your own chess pieces for ChessPie games.',
        images: ['/og-piece-editor.png'],
    }, alternates: {
        canonical: "https://chesspie.de/editor/piece", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
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