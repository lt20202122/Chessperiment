'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Project } from '@/types/Project';
import { getProject, saveProject } from '@/lib/firestore-client';
import { CustomPiece } from '@/types/firestore';
import { Loader2, Palette, Check, Zap } from 'lucide-react';
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

            // Auto-select first piece if available
            if (loadedProject.customPieces.length > 0) {
                selectPiece(loadedProject.customPieces[0].id || loadedProject.customPieces[0].name, loadedProject.customPieces);
            } else {
                // Create a starter piece if none exists
                await createNewPiece(loadedProject);
            }
        } catch (error) {
            console.error('Error loading project:', error);
            router.push('/editor');
        } finally {
            setLoading(false);
        }
    }

    const selectPiece = (pieceId: string, optionalPieces?: CustomPiece[]) => {
        const targetPieces = optionalPieces || project?.customPieces || [];
        const piece = targetPieces.find(p => p.id === pieceId || p.name === pieceId);
        if (piece) {
            setSelectedPieceId(pieceId);
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
        const targetProject = currentProject || project;
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
            await saveProject(updatedProject);
            setProject(updatedProject);
            selectPiece(newPiece.id!, updatedProject.customPieces);
        } catch (error) {
            console.error('Error creating piece:', error);
        }
    };

    const handleSavePiece = async (overrides?: Partial<CustomPiece>) => {
        if (!project || !user || !selectedPieceId) return;

        setIsSaving(true);
        try {
            const updatedPieces = project.customPieces.map((p: CustomPiece) => {
                if (p.id === selectedPieceId || p.name === selectedPieceId) {
                    return {
                        ...p,
                        name: overrides?.name ?? currentName,
                        pixelsWhite: overrides?.pixelsWhite ?? currentPixelsWhite,
                        pixelsBlack: overrides?.pixelsBlack ?? currentPixelsBlack,
                        imageWhite: overrides?.imageWhite ?? currentImageWhite,
                        imageBlack: overrides?.imageBlack ?? currentImageBlack,
                        moves: overrides?.moves ?? currentMoves,
                        updatedAt: new Date()
                    } as CustomPiece;
                }
                return p;
            });

            const updatedProject: Project = {
                ...project,
                customPieces: updatedPieces,
                updatedAt: new Date()
            };

            await saveProject(updatedProject);
            setProject(updatedProject);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving piece:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePiece = async (pieceId: string) => {
        if (!project || !confirm(t('deleteConfirm'))) return;

        try {
            const updatedPieces = project.customPieces.filter((p: CustomPiece) => p.id !== pieceId && p.name !== pieceId);
            const updatedProject: Project = {
                ...project,
                customPieces: updatedPieces,
                updatedAt: new Date()
            };

            await saveProject(updatedProject);
            setProject(updatedProject);

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

                    <div className="h-10 mt-4 flex items-center justify-center">
                        <AnimatePresence>
                            {saveStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-bold border border-emerald-500/20"
                                >
                                    <Check size={16} /> {t('saved')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {selectedPieceId && (
                        <div className="mt-6 flex justify-center">
                            <Link href={`/${locale}/editor/piece/${selectedPieceId}/logic`}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95"
                                >
                                    <Zap size={18} />
                                    {t('advancedLogicTitle')}
                                </motion.button>
                            </Link>
                        </div>
                    )}
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
                            handleSavePiece(editingColor === 'white' ? { pixelsWhite: pixels } : { pixelsBlack: pixels });
                        }}
                        selectedPieceId={selectedPieceId || 'new'}
                    />
                ) : (
                    <VisualMoveEditor
                        moves={currentMoves}
                        onUpdate={(moves) => {
                            setCurrentMoves(moves);
                            handleSavePiece({ moves });
                        }}
                        pieceId={selectedPieceId || undefined}
                    />
                )}
            </div>

            <PieceEditorSidebar
                sets={[]} // Not used in project mode
                currentSetId={projectId}
                setCurrentSetId={() => { }}
                pieces={project.customPieces as any}
                selectedPieceId={selectedPieceId}
                setSelectedPieceId={(id) => selectPiece(id)}
                onCreateNewPiece={() => createNewPiece()}
                onCreateNewSet={() => { }}
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
                onGenerateInvertedPiece={() => { }} // Implement if needed
                onImageUpload={handleImageUpload}
            />
        </div>
    );
}
