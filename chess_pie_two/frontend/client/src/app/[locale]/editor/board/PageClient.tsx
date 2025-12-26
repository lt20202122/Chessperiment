"use client";
import EditorLayout from '@/components/editor/EditorLayout';
import EditorSidebar from '@/components/editor/EditorSidebar';
import BoardEditor from '@/components/editor/BoardEditor';
import { Grid3x3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
export type EditMode = 'shape' | 'pieces';




export default function PageClient() {
    const t = useTranslations('Editor.Board');
    const [editMode, setEditMode] = useState<EditMode>('shape');
    const [selectedPiece, setSelectedPiece] = useState({ type: 'Pawn', color: 'white' });
    const [boardStyle, setBoardStyle] = useState('v3');


    return (
        <>

            <EditorLayout sidebar={
                <EditorSidebar
                    editMode={editMode}
                    setEditMode={setEditMode}
                    selectedPiece={selectedPiece}
                    setSelectedPiece={setSelectedPiece}
                    boardStyle={boardStyle}
                    setBoardStyle={setBoardStyle}
                />
            }>
                <div className="flex flex-col items-center w-full">
                    <div className="mb-12 text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-hover text-xs font-semibold uppercase tracking-widest mb-4 border border-accent/20">
                            <Grid3x3 size={14} /> {t('badge')}
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
                    <BoardEditor
                        editMode={editMode}
                        selectedPiece={selectedPiece}
                        boardStyle={boardStyle}
                    />
                </div>
            </EditorLayout>
        </>
    );
}