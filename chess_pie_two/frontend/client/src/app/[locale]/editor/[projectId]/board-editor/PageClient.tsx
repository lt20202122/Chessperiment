'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { CustomPiece } from '@/types/firestore';
import { getProject, saveProject } from '@/lib/firestore-client';
import { Loader2, Grid3x3 } from 'lucide-react';
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
    const [editMode, setEditMode] = useState<EditMode>('shape');
    const [selectedPiece, setSelectedPiece] = useState({ type: 'Pawn', color: 'white' });
    const [boardStyle, setBoardStyle] = useState('v3');

    // Transform project.customPieces into the format expected by BoardEditor
    const customCollection = useMemo(() => {
        if (!project?.customPieces) return {};
        const collection: Record<string, any> = {};
        project.customPieces.forEach((p: CustomPiece) => {
            collection[`${p.id}_white`] = {
                name: p.name,
                color: 'white',
                pixels: p.pixelsWhite,
                moves: p.moves || [],
                logic: p.logic || [],
                originalId: p.id
            };
            collection[`${p.id}_black`] = {
                name: p.name,
                color: 'black',
                pixels: p.pixelsBlack,
                moves: p.moves || [],
                logic: p.logic || [],
                originalId: p.id
            };
        });
        return collection;
    }, [project?.customPieces]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        loadProject();
    }, [user, authLoading, projectId, router]);

    async function loadProject() {
        if (!user) return;

        setLoading(true);
        try {
            const loadedProject = await getProject(projectId, user.uid);
            if (!loadedProject) {
                router.push('/editor');
                return;
            }
            setProject(loadedProject);
        } catch (error) {
            console.error('Error loading project:', error);
            router.push('/editor');
        } finally {
            setLoading(false);
        }
    }

    const handleSaveBoard = useCallback(async (rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>) => {
        if (!project || !user) return;

        const updatedProject: Project = {
            ...project,
            rows,
            cols,
            activeSquares: Array.from(activeSquares),
            placedPieces,
            updatedAt: new Date()
        };

        try {
            await saveProject(updatedProject);
            setProject(updatedProject);
        } catch (error) {
            console.error('Error saving board:', error);
        }
    }, [project, user]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="relative min-h-screen">
            <div className="pt-24 pb-32 px-4 flex flex-col items-center w-full">
                <div className="mb-12 text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-hover text-xs font-semibold uppercase tracking-widest mb-4 border border-accent/20">
                        <Grid3x3 size={14} /> {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">
                        {t.rich('title', {
                            accent: (chunks) => <span className="text-accent underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                        })}
                    </h1>
                    <p className="text-stone-500 dark:text-white/60 text-lg leading-relaxed max-w-lg mx-auto">
                        {project.name} - {t('description')}
                    </p>
                </div>

                <BoardEditor
                    editMode={editMode}
                    selectedPiece={selectedPiece}
                    boardStyle={boardStyle}
                    generateBoardData={handleSaveBoard}
                    customCollection={customCollection}
                    initialData={{
                        rows: project.rows,
                        cols: project.cols,
                        gridType: project.gridType,
                        activeSquares: project.activeSquares,
                        placedPieces: project.placedPieces
                    }}
                />
            </div>

            <ProjectEditorSidebar projectId={projectId} />
            <BottomPiecePanel project={project} />
        </div>
    );
}
