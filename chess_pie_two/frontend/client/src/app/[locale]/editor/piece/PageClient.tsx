"use client"
import EditorLayout from '@/components/editor/EditorLayout';
import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import VisualMoveEditor from '@/components/editor/VisualMoveEditor';
import { Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getUserPieceSetsAction, getCustomPieceAction, savePieceSetAction, saveCustomPieceAction, getSetPiecesAction } from '@/app/actions/library';
import { PieceSet, CustomPiece } from '@/lib/firestore';

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

    // Load sets and check for edit mode
    useEffect(() => {
        loadSets();

        // Check if we're editing a piece from library
        const editId = localStorage.getItem('editPieceId');
        if (editId) {
            loadPieceForEditing(editId);
            localStorage.removeItem('editPieceId');
        }
    }, []);

    const loadSets = async () => {
        try {
            const loadedSets = await getUserPieceSetsAction();
            if (loadedSets.length === 0) {
                // Create default set
                const defaultSetId = await savePieceSetAction({
                    name: 'My First Set',
                    description: 'Your first piece collection',
                    isStarred: false
                });
                const newSet = { id: defaultSetId, name: 'My First Set', description: 'Your first piece collection', isStarred: false, userId: '', createdAt: new Date(), updatedAt: new Date() };
                setSets([newSet]);
                setCurrentSetId(defaultSetId);
                setSetName('My First Set');
            } else {
                setSets(loadedSets as any);
                setCurrentSetId(loadedSets[0].id!);
                setSetName(loadedSets[0].name);
                loadSetPieces(loadedSets[0].id!);
            }
        } catch (error) {
            console.error('Failed to load sets:', error);
        }
    };

    const loadSetPieces = async (setId: string) => {
        try {
            const loadedPieces = await getSetPiecesAction(setId);
            setPieces(loadedPieces as any);
            if (loadedPieces.length > 0) {
                selectPiece(loadedPieces[0].id!);
            } else {
                // Create first piece in set
                createNewPiece();
            }
        } catch (error) {
            console.error('Failed to load pieces:', error);
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
        }
    };

    const createNewPiece = () => {
        setSelectedPieceId(null);
        setEditingPieceId(null);
        setCurrentPixels(Array(64).fill(null).map(() => Array(64).fill('transparent')));
        setCurrentMoves([]);
        setCurrentName('New Piece');
        setCurrentColor('white');
    };

    const handleSavePiece = async () => {
        if (!currentSetId) return;

        setIsSaving(true);
        try {
            const pieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                id: editingPieceId || undefined,
                setId: currentSetId,
                name: currentName,
                color: currentColor,
                pixels: currentPixels,
                moves: currentMoves
            };

            const savedId = await saveCustomPieceAction(pieceData);

            // Reload pieces
            await loadSetPieces(currentSetId);
            setEditingPieceId(savedId);
            setSelectedPieceId(savedId);

            console.log('✅ Piece saved successfully');
        } catch (error) {
            console.error('Failed to save piece:', error);
            alert(t('errorSaving'));
        } finally {
            setIsSaving(false);
        }
    };

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
        // Auto-save after commit
        setTimeout(() => handleSavePiece(), 500);
    };

    const updateCurrentMoves = (newMoves: any[]) => {
        setCurrentMoves(newMoves);
        // Auto-save moves
        setTimeout(() => handleSavePiece(), 500);
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
            />
        }>
            <div className="flex flex-col items-center w-full relative">
                <div className="mb-12 text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4 border border-amber-400/20">
                        <Palette size={14} /> {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        {t.rich('title', {
                            accent: (chunks) => <span className="text-amber-500 underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                        })}
                    </h1>
                    <p className="text-white/60 text-lg leading-relaxed max-w-lg mx-auto">
                        {t('description')}
                    </p>
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
                    />
                )}
            </div>
        </EditorLayout>
    );
}
