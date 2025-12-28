"use client"
import EditorLayout from '@/components/editor/EditorLayout';
import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import { Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
// app/editor/piece/page.tsx




export default function PageClient() {
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

            <EditorLayout sidebar={
                <PieceEditorSidebar
                    selectedPiece={selectedPiece}
                    setSelectedPiece={setSelectedPiece}
                    pixels={pixels}
                    setPixels={setPixels}
                />
            }>
                <div className="flex flex-col items-center w-full relative">
                    {/* Coming Soon Overlay */}
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        <div className="text-center p-10 bg-black/60 backdrop-blur-lg rounded-3xl border border-amber-500/40 max-w-lg shadow-[0_0_50px_rgba(251,191,36,0.3)] animate-in zoom-in slide-in-from-bottom-8 duration-700">
                            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                                <Palette size={40} className="text-amber-500" />
                            </div>
                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">
                                {t('inProduction') || 'Creator Studio'}
                            </h2>
                            <p className="text-gray-200 font-medium text-lg leading-relaxed mb-8">
                                {t('pieceEditorBetaMessage') || 'The Piece Editor is currently in beta and only available to selected creators. We are working hard to bring pixel-perfect customization to everyone!'}
                            </p>
                            <div className="flex justify-center gap-2">
                                <span className="px-4 py-1.5 bg-amber-500/20 text-amber-500 font-bold rounded-full text-sm border border-amber-500/30">Coming 2026</span>
                            </div>
                        </div>
                    </div>

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
