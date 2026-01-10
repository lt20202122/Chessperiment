"use client"
import EditorLayout from '@/components/editor/EditorLayout';
import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import VisualMoveEditor from '@/components/editor/VisualMoveEditor';
import SaveToSetModal from '@/components/editor/SaveToSetModal';
import { Palette, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserPieceSetsAction, getCustomPieceAction, savePieceSetAction, saveCustomPieceAction, getSetPiecesAction, deleteCustomPieceAction } from '@/app/actions/library';
import { PieceSet, CustomPiece } from '@/lib/firestore';
import { invertLightness } from '@/lib/colors';

export default function PageClient() {
    const t = useTranslations('Editor.Piece');

    // Set management
    const [sets, setSets] = useState<(PieceSet & { id: string })[]>([]);
    const [currentSetId, setCurrentSetId] = useState<string | null>(null);
    const [setName, setSetName] = useState('My First Set');

    // Piece management
    const [pieces, setPieces] = useState<(CustomPiece & { id: string })[]>([]);
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [editingPieceId, setEditingPieceId] = useState<string | null>(null); // From library

    // Editor state
    const [mode, setMode] = useState<'design' | 'moves'>('design');
    const [currentPixels, setCurrentPixels] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentMoves, setCurrentMoves] = useState<any[]>([]);
    const [currentName, setCurrentName] = useState('New Piece');
    const [currentColor, setCurrentColor] = useState<'white' | 'black'>('white');

    // History for undo/redo
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [gridSize] = useState(64);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Load sets and check for edit mode
    useEffect(() => {
        initializeEditor();
    }, []);

    const initializeEditor = async () => {
        try {
            // Check if we're editing a piece from library
            const editId = localStorage.getItem('editPieceId');
            if (editId) {
                await loadPieceForEditing(editId);
                localStorage.removeItem('editPieceId');
                return;
            }

            // Load all sets
            const loadedSets = await getUserPieceSetsAction();
            setSets(loadedSets as any);

            if (loadedSets.length === 0) {
                // No sets exist - show modal to create first set
                setIsSaveModalOpen(true);
                return;
            }

            // Auto-select the most recently updated set
            const sortedSets = [...loadedSets].sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            const mostRecentSet = sortedSets[0];

            setCurrentSetId(mostRecentSet.id!);
            await loadSetPieces(mostRecentSet.id!);
        } catch (error) {
            console.error('Failed to initialize editor:', error);
            // If there's an error, show the modal
            setIsSaveModalOpen(true);
        }
    };

    const loadSetPieces = async (setId: string) => {
        try {
            const loadedPieces = await getSetPiecesAction(setId);
            setPieces(loadedPieces as any);

            if (loadedPieces.length === 0) {
                // Set is empty - create starter pieces automatically
                await createStarterPieces(setId);
            } else {
                // Select the first piece
                selectPiece(loadedPieces[0].id!);
            }
        } catch (error) {
            console.error('Failed to load pieces:', error);
        }
    };

    const createStarterPieces = async (setId: string) => {
        try {
            // Create white piece
            const whitePieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                setId: setId,
                name: 'NewPiece',
                color: 'white',
                pixels: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                moves: []
            };
            const whiteId = await saveCustomPieceAction(whitePieceData);

            // Create black piece
            const blackPieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                setId: setId,
                name: 'NewPiece',
                color: 'black',
                pixels: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                moves: []
            };
            await saveCustomPieceAction(blackPieceData);

            // Reload pieces and select the white one
            const loadedPieces = await getSetPiecesAction(setId);
            setPieces(loadedPieces as any);
            selectPiece(whiteId);
        } catch (error) {
            console.error('Failed to create starter pieces:', error);
        }
    };

    const loadPieceForEditing = async (pieceId: string) => {
        try {
            const piece = await getCustomPieceAction(pieceId);
            if (piece) {
                setEditingPieceId(pieceId);
                setCurrentSetId(piece.setId);
                setCurrentPixels(piece.pixels);
                setCurrentMoves(piece.moves || []);
                setCurrentName(piece.name);
                setCurrentColor(piece.color);
                setSelectedPieceId(pieceId);

                // Load the set
                await loadSetPieces(piece.setId);
            }
        } catch (error) {
            console.error('Failed to load piece for editing:', error);
        }
    };

    const selectPiece = (pieceId: string) => {
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) {
            setSelectedPieceId(pieceId);
            setCurrentPixels(piece.pixels);
            setCurrentMoves(piece.moves || []);
            setCurrentName(piece.name);
            setCurrentColor(piece.color);
            setEditingPieceId(pieceId);
            // Ensure we update currentSetId when selecting a piece from the set
            if (piece.setId) setCurrentSetId(piece.setId);
        }
    };

    const createNewPiece = async () => {
        if (!currentSetId) {
            // No set selected - show modal
            setIsSaveModalOpen(true);
            return;
        }

        try {
            // Create a new blank piece in the current set
            const newPieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                setId: currentSetId,
                name: 'New Piece',
                color: 'white',
                pixels: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                moves: []
            };

            const newPieceId = await saveCustomPieceAction(newPieceData);

            // Reload pieces and select the new one
            const loadedPieces = await getSetPiecesAction(currentSetId);
            setPieces(loadedPieces as any);
            selectPiece(newPieceId);
        } catch (error) {
            console.error('Failed to create new piece:', error);
        }
    };

    const handleSavePiece = async (overrides?: { pixels?: string[][], moves?: any[], name?: string, color?: 'white' | 'black', sourceId?: string }) => {
        // If no set is selected, open the modal to let user choose/create a set
        if (!currentSetId) {
            setIsSaveModalOpen(true);
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');
        try {
            const pieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                id: editingPieceId || undefined,
                setId: currentSetId,
                name: overrides?.name ?? currentName,
                color: overrides?.color ?? currentColor,
                pixels: overrides?.pixels ?? currentPixels,
                moves: overrides?.moves ?? currentMoves,
                sourceId: overrides?.sourceId ?? (pieces.find(p => p.id === editingPieceId)?.sourceId)
            };

            const savedId = await saveCustomPieceAction(pieceData);

            // Reload pieces 
            const loadedPieces = await getSetPiecesAction(currentSetId);
            setPieces(loadedPieces as any);

            setEditingPieceId(savedId);
            setSelectedPieceId(savedId);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);

            console.log('✅ Piece saved successfully');
        } catch (error) {
            console.error('Failed to save piece:', error);
            setSaveStatus('error');
            if (!overrides) alert(t('errorSaving'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectSetAndSave = async (setId: string) => {
        setIsSaveModalOpen(false);
        setCurrentSetId(setId);

        try {
            // Load pieces in the selected set
            const loadedPieces = await getSetPiecesAction(setId);

            if (loadedPieces.length === 0) {
                // Set is empty - create starter pieces
                await createStarterPieces(setId);
            } else {
                // Set has pieces - load them and select the first one
                setPieces(loadedPieces as any);
                selectPiece(loadedPieces[0].id!);
            }

            // Reload sets list
            const refreshedSets = await getUserPieceSetsAction();
            setSets(refreshedSets as any);
        } catch (error) {
            console.error('Failed to initialize set:', error);
        }
    };

    const handleDeletePiece = async (pieceId: string) => {
        if (!confirm('Are you sure you want to delete this piece?')) return;
        try {
            await deleteCustomPieceAction(pieceId);
            if (currentSetId) loadSetPieces(currentSetId);
            if (selectedPieceId === pieceId) createNewPiece();
        } catch (error) {
            console.error('Failed to delete piece:', error);
        }
    };

    const generateInvertedPiece = async () => {
        if (!currentSetId || !selectedPieceId) return;

        try {
            const currentPiece = pieces.find(p => p.id === selectedPieceId);
            if (!currentPiece) return;

            // Search for existing counterpart using sourceId or name fallback
            let existingInverted = pieces.find(p =>
                (p.sourceId === currentPiece.id || currentPiece.sourceId === p.id) &&
                p.color !== currentPiece.color
            );

            if (!existingInverted) {
                // Fallback: match by name only if it's the only one of that color
                const sameName = pieces.filter(p => p.name === currentPiece.name && p.color !== currentPiece.color);
                if (sameName.length === 1) {
                    existingInverted = sameName[0];
                }
            }

            if (existingInverted) {
                if (!confirm(`An inverted piece (${existingInverted.color}) already exists. Update it?`)) {
                    // Create new instead
                    existingInverted = undefined;
                }
            }

            const invertedPixels = currentPiece.pixels.map(row =>
                row.map(color => (color === 'transparent' || !color.startsWith('#')) ? color : invertLightness(color))
            );

            const invertedColor = currentPiece.color === 'white' ? 'black' : 'white';
            const invertedPieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                id: existingInverted?.id,
                setId: currentSetId,
                name: currentPiece.name,
                color: invertedColor,
                pixels: invertedPixels,
                moves: currentPiece.moves || [],
                sourceId: currentPiece.id
            };

            const newPieceId = await saveCustomPieceAction(invertedPieceData);
            const loadedPieces = await getSetPiecesAction(currentSetId);
            setPieces(loadedPieces as any);
            selectPiece(newPieceId);
        } catch (error) {
            console.error('Inversion failed:', error);
        }
    };

    // Auto-save name and color
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editingPieceId) {
                const piece = pieces.find(p => p.id === editingPieceId);
                if (piece && (piece.name !== currentName || piece.color !== currentColor)) {
                    handleSavePiece({ name: currentName, color: currentColor });
                }
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [currentName, currentColor, editingPieceId]);

    const addToHistory = (newPixels: string[][]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newPixels)));
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        console.log('📚 Added to history. History length:', newHistory.length);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setCurrentPixels(prevState);
            setHistoryIndex(historyIndex - 1);
            console.log('⏪ Undo to index:', historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setCurrentPixels(nextState);
            setHistoryIndex(historyIndex + 1);
            console.log('⏩ Redo to index:', historyIndex + 1);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSavePiece();
            }
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history, currentPixels, currentMoves, currentName, currentColor]);

    const updateCurrentPixels = (newPixels: string[][]) => {
        setCurrentPixels(newPixels);
    };

    const commitPixels = (finalPixels: string[][]) => {
        console.log('✅ commitPixels called');
        setCurrentPixels(finalPixels);
        addToHistory(finalPixels);
        // Auto-save after commit with the NEW pixels
        setTimeout(() => handleSavePiece({ pixels: finalPixels }), 100);
    };

    const updateCurrentMoves = (newMoves: any[]) => {
        setCurrentMoves(newMoves);
        // Auto-save moves with the NEW moves
        setTimeout(() => handleSavePiece({ moves: newMoves }), 100);
    };

    return (
        <EditorLayout sidebar={
            <PieceEditorSidebar
                sets={sets}
                currentSetId={currentSetId}
                setCurrentSetId={(id) => {
                    setCurrentSetId(id);
                    loadSetPieces(id);
                }}
                pieces={pieces}
                selectedPieceId={selectedPieceId}
                setSelectedPieceId={selectPiece}
                onCreateNewPiece={createNewPiece}
                onCreateNewSet={() => setIsSaveModalOpen(true)}
                onSavePiece={handleSavePiece}
                isSaving={isSaving}
                currentName={currentName}
                setCurrentName={setCurrentName}
                currentColor={currentColor}
                setCurrentColor={setCurrentColor}
                mode={mode}
                setMode={setMode}
                undo={undo}
                redo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onDeletePiece={handleDeletePiece}
                onGenerateInvertedPiece={generateInvertedPiece}
            />
        }>
            <div className="flex flex-col items-center w-full relative">
                <div className="mb-12 text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4 border border-amber-400/20">
                        <Palette size={14} /> {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">
                        {t.rich('title', {
                            accent: (chunks) => <span className="text-amber-500 underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                        })}
                    </h1>
                    <p className="text-stone-500 dark:text-white/60 text-lg leading-relaxed max-w-lg mx-auto">
                        {t('description')}
                    </p>

                    <AnimatePresence>
                        {saveStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-bold border border-emerald-500/20"
                            >
                                <Check size={16} /> {t('saved')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {mode === 'design' ? (
                    <PixelCanvas
                        gridSize={gridSize}
                        pixels={currentPixels}
                        setPixels={updateCurrentPixels}
                        commitPixels={commitPixels}
                        selectedPieceId={selectedPieceId || 'new'}
                    />
                ) : (
                    <VisualMoveEditor
                        moves={currentMoves}
                        onUpdate={updateCurrentMoves}
                        pieceId={editingPieceId || undefined}
                    />
                )}
            </div>

            <SaveToSetModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSelectSet={handleSelectSetAndSave}
                currentPieceName={currentName}
            />
        </EditorLayout>
    );
}
