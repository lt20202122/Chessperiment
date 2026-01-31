'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Project } from '@/types/Project';
import { getProjectAction, saveProjectAction } from '@/app/actions/editor';
import { CustomPiece } from '@/types/firestore';
import { Loader2, Palette, Check, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import VisualMoveEditor from '@/components/editor/VisualMoveEditor';
import { invertLightness } from '@/lib/colors';

export type EditMode = 'design' | 'moves';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const t = useTranslations('Editor.Piece');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const locale = useLocale();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [mode, setMode] = useState<'design' | 'moves'>('design');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Use a ref to always have the latest state for auto-saves
    const projectRef = useRef<Project | null>(null);

    // Sync ref with state
    useEffect(() => {
        projectRef.current = project;
    }, [project]);

    // Editor state for the CURRENTLY selected piece
    const [currentName, setCurrentName] = useState('New Piece');
    const [editingColor, setEditingColor] = useState<'white' | 'black'>('white');
    const [currentPixelsWhite, setCurrentPixelsWhite] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentPixelsBlack, setCurrentPixelsBlack] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentImageWhite, setCurrentImageWhite] = useState<string | undefined>(undefined);
    const [currentImageBlack, setCurrentImageBlack] = useState<string | undefined>(undefined);
    const [currentMoves, setCurrentMoves] = useState<any[]>([]);

    // History for undo/redo
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const gridSize = 64;

    useEffect(() => {
        if (!selectedPieceId || !project) return;
        const piece = project.customPieces.find(p => p.id === selectedPieceId);
        if (piece) {
            const pixels = editingColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack;
            setHistory([JSON.parse(JSON.stringify(pixels))]);
            setHistoryIndex(0);
        }
    }, [editingColor]);

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
            const result = await getProjectAction(projectId);
            if (result.success && result.data) {
                const loadedProject = result.data;
                setProject(loadedProject);

                // Auto-select first piece if available
                if (loadedProject.customPieces && loadedProject.customPieces.length > 0) {
                    selectPiece(loadedProject.customPieces[0].id || loadedProject.customPieces[0].name, loadedProject.customPieces);
                } else {
                    // Create a starter piece if none exists
                    await createNewPiece(loadedProject);
                }
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

    const selectPiece = (pieceId: string, optionalPieces?: CustomPiece[]) => {
        const targetPieces = optionalPieces || projectRef.current?.customPieces || [];
        const piece = targetPieces.find(p => p.id === pieceId || p.name === pieceId);
        if (piece) {
            // Prefer ID if it exists, otherwise name
            setSelectedPieceId(piece.id || piece.name);
            setCurrentName(piece.name);
            setCurrentPixelsWhite(piece.pixelsWhite);
            setCurrentPixelsBlack(piece.pixelsBlack);
            setCurrentImageWhite(piece.imageWhite);
            setCurrentImageBlack(piece.imageBlack);
            setCurrentMoves(piece.moves || []);
            setHistory([JSON.parse(JSON.stringify(editingColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack))]);
            setHistoryIndex(0);
        }
    };

    const createNewPiece = async (currentProject?: Project) => {
        const targetProject = currentProject || projectRef.current;
        if (!targetProject || !user) return;

        const newPiece: CustomPiece = {
            id: crypto.randomUUID(),
            projectId: projectId,
            userId: user.uid,
            name: 'New Piece',
            pixelsWhite: Array(64).fill(null).map(() => Array(64).fill('transparent')),
            pixelsBlack: Array(64).fill(null).map(() => Array(64).fill('transparent')),
            moves: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            setId: '' // Legacy
        };

        const updatedProject: Project = {
            ...targetProject,
            customPieces: [...targetProject.customPieces, newPiece],
            updatedAt: new Date()
        };

        try {
            // Update local state and ref immediately
            setProject(updatedProject);
            projectRef.current = updatedProject;

            await saveProjectAction(serializeProjectForAction(updatedProject));
            selectPiece(newPiece.id!, updatedProject.customPieces);
        } catch (error) {
            console.error('Error creating piece:', error);
        }
    };

    const handleSavePiece = async (overrides?: Partial<CustomPiece>, silent: boolean = false) => {
        const currentProject = projectRef.current;
        if (!currentProject || !user || !selectedPieceId) return;

        if (!silent) setIsSaving(true);
        try {
            // 1. Calculate the updated piece
            const pieceToUpdate = currentProject.customPieces.find(p => p.id === selectedPieceId || p.name === selectedPieceId);
            if (!pieceToUpdate) return;

            const updatedPiece: CustomPiece = {
                ...pieceToUpdate,
                name: overrides?.name ?? currentName,
                pixelsWhite: overrides?.pixelsWhite ?? (pieceToUpdate.id === selectedPieceId || pieceToUpdate.name === selectedPieceId ? currentPixelsWhite : pieceToUpdate.pixelsWhite),
                pixelsBlack: overrides?.pixelsBlack ?? (pieceToUpdate.id === selectedPieceId || pieceToUpdate.name === selectedPieceId ? currentPixelsBlack : pieceToUpdate.pixelsBlack),
                imageWhite: overrides?.imageWhite ?? currentImageWhite,
                imageBlack: overrides?.imageBlack ?? currentImageBlack,
                moves: overrides?.moves ?? currentMoves,
                updatedAt: new Date()
            };

            // 2. Create the full project update
            const updatedProject: Project = {
                ...currentProject,
                customPieces: currentProject.customPieces.map(p =>
                    (p.id === selectedPieceId || p.name === selectedPieceId) ? updatedPiece : p
                ),
                updatedAt: new Date()
            };

            // 3. Update local state AND ref immediately for responsiveness and to prevent stale overwrites
            setProject(updatedProject);
            projectRef.current = updatedProject;

            // 4. Save to database - Ensure serializable data for server action
            const result = await saveProjectAction(serializeProjectForAction(updatedProject));

            if (result.success) {
                if (!silent) {
                    setSaveStatus('success');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                }
            } else {
                console.error('Failed to save piece:', result.error);
                if (!silent) setSaveStatus('error');
            }
        } catch (error) {
            console.error('Error saving piece:', error);
            if (!silent) setSaveStatus('error');
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    // Helper to ensure Dates are strings before sending to server action
    const serializeProjectForAction = (p: Project): any => {
        return {
            ...p,
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
            customPieces: p.customPieces.map(pc => ({
                ...pc,
                createdAt: pc.createdAt instanceof Date ? pc.createdAt.toISOString() : pc.createdAt,
                updatedAt: pc.updatedAt instanceof Date ? pc.updatedAt.toISOString() : pc.updatedAt,
            }))
        };
    };

    const handleDeletePiece = async (pieceId: string) => {
        if (!project || !confirm(t('deleteConfirm'))) return;

        try {
            const targetProject = projectRef.current; // Use ref for latest project state
            if (!targetProject) return;

            const updatedPieces = targetProject.customPieces.filter((p: CustomPiece) => p.id !== pieceId && p.name !== pieceId);
            const updatedProject: Project = {
                ...targetProject,
                customPieces: updatedPieces,
                updatedAt: new Date()
            };

            setProject(updatedProject);
            projectRef.current = updatedProject;
            await saveProjectAction(serializeProjectForAction(updatedProject));

            if (selectedPieceId === pieceId) {
                if (updatedPieces.length > 0) {
                    selectPiece(updatedPieces[0].id || updatedPieces[0].name, updatedPieces);
                } else {
                    setSelectedPieceId(null);
                }
            }
        } catch (error) {
            console.error('Error deleting piece:', error);
        }
    };

    const addToHistory = useCallback((newPixels: string[][]) => {
        setHistory((prev: any[]) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(JSON.parse(JSON.stringify(newPixels)));
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            if (editingColor === 'white') setCurrentPixelsWhite(prevState);
            else setCurrentPixelsBlack(prevState);
            setHistoryIndex((prev: number) => prev - 1);
        }
    }, [historyIndex, history, editingColor]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            if (editingColor === 'white') setCurrentPixelsWhite(nextState);
            else setCurrentPixelsBlack(nextState);
            setHistoryIndex((prev: number) => prev + 1);
        }
    }, [historyIndex, history, editingColor]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            // In project mode, we might want to just handle it locally or through some action
            // For now, let's just use the dataUrl directly
            if (editingColor === 'white') {
                setCurrentImageWhite(dataUrl);
                handleSavePiece({ imageWhite: dataUrl });
            } else {
                setCurrentImageBlack(dataUrl);
                handleSavePiece({ imageBlack: dataUrl });
            }
        };
        reader.readAsDataURL(file);
    };

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
            <div className="pt-24 pb-32 px-4 flex flex-col items-center w-full relative">
                <Link
                    href={`/editor/${projectId}`}
                    className="absolute top-8 left-8 p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-white transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-50 hidden md:flex"
                    title={t('backToProject')}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="mb-12 text-center max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4 border border-amber-400/20">
                        <Palette size={14} /> {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">
                        {t.rich("title", {
                            accent: chunks => <span className="text-accent underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                        })}
                    </h1>
                    <p className="text-stone-500 dark:text-white/60 text-lg leading-relaxed max-w-lg mx-auto">
                        {project.name} - {t('description')}
                    </p>
                </div>

                {mode === 'design' ? (
                    <PixelCanvas
                        gridSize={gridSize}
                        pixels={editingColor === 'white' ? currentPixelsWhite : currentPixelsBlack}
                        image={editingColor === 'white' ? currentImageWhite : currentImageBlack}
                        setPixels={(pixels) => editingColor === 'white' ? setCurrentPixelsWhite(pixels) : setCurrentPixelsBlack(pixels)}
                        commitPixels={(pixels) => {
                            addToHistory(pixels);
                            if (editingColor === 'white') setCurrentPixelsWhite(pixels);
                            else setCurrentPixelsBlack(pixels);
                            handleSavePiece(editingColor === 'white' ? { pixelsWhite: pixels } : { pixelsBlack: pixels }, true);
                        }}
                        selectedPieceId={selectedPieceId || 'new'}
                    />
                ) : (
                    <VisualMoveEditor
                        moves={currentMoves}
                        onUpdate={(moves) => {
                            setCurrentMoves(moves);
                            handleSavePiece({ moves }, true);
                        }}
                        pieceId={selectedPieceId || undefined}
                    />
                )}
            </div>

            <PieceEditorSidebar
                pieces={project.customPieces as any}
                selectedPieceId={selectedPieceId}
                setSelectedPieceId={(id) => selectPiece(id)}
                onCreateNewPiece={() => createNewPiece()}
                onSavePiece={() => handleSavePiece()}
                isSaving={isSaving}
                currentName={currentName}
                setCurrentName={setCurrentName}
                currentColor={editingColor}
                setCurrentColor={setEditingColor}
                mode={mode}
                setMode={(m: any) => setMode(m)}
                undo={undo}
                redo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onDeletePiece={handleDeletePiece}
                onGenerateInvertedPiece={() => {
                    if (!confirm(t('confirmInvert'))) return;
                    if (editingColor === 'white') {
                        const inverted = currentPixelsWhite.map(row =>
                            row.map(pixel => invertLightness(pixel))
                        );
                        setCurrentPixelsBlack(inverted);
                        handleSavePiece({ pixelsBlack: inverted });
                    } else {
                        const inverted = currentPixelsBlack.map(row =>
                            row.map(pixel => invertLightness(pixel))
                        );
                        setCurrentPixelsWhite(inverted);
                        handleSavePiece({ pixelsWhite: inverted });
                    }
                }}
                onImageUpload={handleImageUpload}
            />
        </div>
    );
}
