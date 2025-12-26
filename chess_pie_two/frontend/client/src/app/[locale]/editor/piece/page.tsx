"use client"
import EditorLayout from '@/components/editor/EditorLayout';
import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import { Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import type { Metadata } from "next"
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

// app/editor/piece/page.tsx
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

const jsonLd_pieceEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Piece Editor",
    "url": "https://chesspie.de/editor/piece",
    "description": "Design and customize chess pieces — shapes, colors, and animations.",
    "applicationCategory": "DesignApplication",
    "provider": { "@type": "Organization", "name": "ChessPie" }
};

export default function PieceEditorPage() {
    const t = useTranslations('Editor.Piece');
    const [selectedPiece, setSelectedPiece] = useState({ type: 'pawn', color: 'white' });
    const [pixels, setPixels] = useState<string[][]>([]);
    const [gridSize] = useState(32);

    useEffect(() => {
        const savedPixels = localStorage.getItem('pixels');
        if (savedPixels) {
            setPixels(JSON.parse(savedPixels));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('pixels', JSON.stringify(pixels));
    }, [pixels]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_pieceEditor).replace(/</g, '\\u003c') }}
            />
            <EditorLayout sidebar={
                <PieceEditorSidebar
                    selectedPiece={selectedPiece}
                    setSelectedPiece={setSelectedPiece}
                    pixels={pixels}
                    setPixels={setPixels}
                />
            }>
                <div className="flex flex-col items-center w-full">
                    <div className="mb-12 text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-hover text-xs font-semibold uppercase tracking-widest mb-4 border border-accent/20">
                            <Palette size={14} /> {t('badge')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-text mb-4 tracking-tight">
                            {t.rich('title', {
                                accent: (chunks) => <span className="text-accent underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                            })}
                        </h1>
                        <p className="text-text/60 text-lg leading-relaxed max-w-lg mx-auto">
                            {t('description')}
                        </p>
                    </div>
                    <PixelCanvas
                        gridSize={gridSize}
                        pixels={pixels}
                        setPixels={setPixels}
                        selectedPiece={selectedPiece}
                    />
                </div>
            </EditorLayout>
        </>
    );
}
