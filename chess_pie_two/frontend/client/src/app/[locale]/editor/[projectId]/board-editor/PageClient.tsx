'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { useProject } from '@/hooks/useProject';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BoardEditor from '@/components/editor/BoardEditor';
import ProjectEditorSidebar from '@/components/editor/ProjectEditorSidebar';
import BottomPiecePanel from '@/components/editor/BottomPiecePanel';

import { EditMode } from '@/types/editor';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const t = useTranslations('Editor.Board');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [editMode, setEditMode] = useState<EditMode>('shape');
    const [selectedPiece, setSelectedPiece] = useState<{ type: string, color: string, movement?: 'run' | 'jump' }>({ type: 'Pawn', color: 'white' });
    const [boardStyle, setBoardStyle] = useState('v3');

    const { project, loading, saveBoard } = useProject(projectId);

    // Transform project.customPieces into the format expected by BoardEditor
    const customCollection = useMemo(() => {
        if (!project?.customPieces) return {};
        const collection: Record<string, any> = {};
        project.customPieces.forEach((p) => {
            collection[`${p.id}_white`] = {
                name: p.name,
                color: 'white',
                pixels: p.pixelsWhite,
                image: p.imageWhite, // Add image for white
                moves: p.moves || [],
                logic: p.logic || [],
                originalId: p.id
            };
            collection[`${p.id}_black`] = {
                name: p.name,
                color: 'black',
                pixels: p.pixelsBlack,
                image: p.imageBlack, // Add image for black
                moves: p.moves || [],
                logic: p.logic || [],
                originalId: p.id
            };
        });
        return collection;
    }, [project?.customPieces]);

    const handleGenerateBoardData = useCallback(async (rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>) => {
        saveBoard({
            rows,
            cols,
            activeSquares: Array.from(activeSquares),
            placedPieces: placedPieces as any
        });
    }, [saveBoard]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex min-h-screen bg-bg">
            <ProjectEditorSidebar projectId={projectId} />

            <main className="flex-1 overflow-hidden flex flex-col pt-20 relative">
                <Link
                    href={`/editor/${projectId}`}
                    className="absolute top-6 left-8 p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-white transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-50"
                    title={t('backToProject')}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <BoardEditor
                    editMode={editMode}
                    selectedPiece={selectedPiece}
                    boardStyle={boardStyle}
                    generateBoardData={handleGenerateBoardData}
                    customCollection={customCollection}
                    onDeselect={() => {
                        setEditMode('shape');
                        setSelectedPiece({ type: 'Pawn', color: 'white' });
                    }}
                    initialData={{
                        rows: project.rows,
                        cols: project.cols,
                        gridType: project.gridType || 'square',
                        activeSquares: project.activeSquares,
                        placedPieces: project.placedPieces
                    }}
                />
            </main>

            <BottomPiecePanel
                project={project}
                onSelectPiece={(piece) => {
                    if (piece.type === '') {
                        setEditMode('shape');
                        setSelectedPiece({ type: 'Pawn', color: 'white' });
                    } else {
                        setEditMode('pieces');
                        setSelectedPiece(piece);
                    }
                }}
                selectedPiece={editMode === 'pieces' ? selectedPiece : null}
            />
        </div>
    );
}
