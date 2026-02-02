'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { getProjectAction, saveProjectAction, saveProjectBoardAction } from '@/app/actions/editor';
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
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Use a ref to always have the latest project state for callbacks without re-creating them
    const projectRef = useRef<Project | null>(null);
    useEffect(() => {
        projectRef.current = project;
    }, [project]);
    const [editMode, setEditMode] = useState<EditMode>('shape');
    const [selectedPiece, setSelectedPiece] = useState<{ type: string, color: string, movement?: 'run' | 'jump' }>({ type: 'Pawn', color: 'white' });
    const [boardStyle, setBoardStyle] = useState('v3');

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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user) return;
        if (project?.id === projectId) return; // Already loaded

        loadProject();
    }, [user?.uid, authLoading, projectId]);

    async function loadProject() {
        if (!user) return;

        // Only show full loader if we don't have a project at all or it's a different one
        if (!project || project.id !== projectId) {
            setLoading(true);
        }
        try {
            const result = await getProjectAction(projectId);
            if (result.success && result.data) {
                setProject(result.data);
            } else {
                console.error('Failed to load project:', result.error);
                router.push('/editor');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            router.push('/editor');
        } finally {
            setLoading(false);
        }
    }

    const handleGenerateBoardData = useCallback(async (rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>) => {
        if (!user || !projectRef.current) return;

        const updatedProject: Project = {
            ...projectRef.current,
            rows,
            cols,
            activeSquares: Array.from(activeSquares),
            placedPieces: placedPieces as any,
            updatedAt: new Date()
        };

        // Update local state
        setProject(updatedProject);

        // Call side effect outside of any state update logic
        // Optimized board-only save to prevent large payload issues
        saveProjectBoardAction(projectId, {
            rows,
            cols,
            activeSquares: Array.from(activeSquares),
            placedPieces: placedPieces as any
        }).catch(err => {
            console.error('Failed to save board:', err);
        });
    }, [user, projectId]);

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
