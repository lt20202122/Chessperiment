"use client"
import { Save, Plus, Trash2, Undo2, Redo2, Type, Move, Loader2, Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { PieceSet, CustomPiece } from '@/lib/firestore';
import { savePieceSetAction, deletePieceSetAction } from '@/app/actions/library';
import PieceRenderer from '@/components/game/PieceRenderer';

interface PieceEditorSidebarProps {
    sets: (PieceSet & { id: string })[];
    currentSetId: string | null;
    setCurrentSetId: (id: string) => void;
    pieces: (CustomPiece & { id: string })[];
    selectedPieceId: string | null;
    setSelectedPieceId: (id: string) => void;
    onCreateNewPiece: () => void;
    onSavePiece: () => void;
    isSaving: boolean;
    currentName: string;
    setCurrentName: (name: string) => void;
    currentColor: 'white' | 'black';
    setCurrentColor: (color: 'white' | 'black') => void;
    mode: 'design' | 'moves';
    setMode: (mode: 'design' | 'moves') => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export default function PieceEditorSidebar({
    sets,
    currentSetId,
    setCurrentSetId,
    pieces,
    selectedPieceId,
    setSelectedPieceId,
    onCreateNewPiece,
    onSavePiece,
    isSaving,
    currentName,
    setCurrentName,
    currentColor,
    setCurrentColor,
    mode,
    setMode,
    undo,
    redo,
    canUndo,
    canRedo
}: PieceEditorSidebarProps) {
    const t = useTranslations('Editor.Piece');
    const [isCreatingSet, setIsCreatingSet] = useState(false);
    const [newSetName, setNewSetName] = useState('');

    const handleCreateSet = async () => {
        if (!newSetName.trim()) return;

        try {
            const setId = await savePieceSetAction({
                name: newSetName,
                description: '',
                isStarred: false
            });
            setCurrentSetId(setId);
            setNewSetName('');
            setIsCreatingSet(false);
            window.location.reload(); // Reload to fetch new set
        } catch (error) {
            console.error('Failed to create set:', error);
        }
    };

    const handleDeleteSet = async () => {
        if (!currentSetId) return;
        if (!confirm('Delete this entire set and all its pieces?')) return;

        try {
            await deletePieceSetAction(currentSetId);
            window.location.reload();
        } catch (error) {
            console.error('Failed to delete set:', error);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-8">
            {/* Set Selector */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Current Set</h3>
                    <button
                        onClick={() => setIsCreatingSet(true)}
                        className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1"
                    >
                        <Plus size={10} /> New
                    </button>
                </div>

                {isCreatingSet ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="Set name..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateSet}
                                className="flex-1 py-2 bg-amber-500 text-bg rounded-xl text-xs font-black"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setIsCreatingSet(false)}
                                className="flex-1 py-2 bg-white/5 text-white rounded-xl text-xs font-black"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <select
                        value={currentSetId || ''}
                        onChange={(e) => setCurrentSetId(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium"
                    >
                        {sets.map(set => (
                            <option key={set.id} value={set.id}>{set.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Piece Name & Color */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Piece Settings</h3>
                <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    placeholder="Piece name..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentColor('white')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${currentColor === 'white'
                                ? 'bg-white text-bg'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                    >
                        White
                    </button>
                    <button
                        onClick={() => setCurrentColor('black')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${currentColor === 'black'
                                ? 'bg-gray-800 text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                    >
                        Black
                    </button>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex gap-1 shadow-inner">
                <button
                    onClick={() => setMode('design')}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'design'
                            ? 'bg-amber-500 text-bg shadow-lg'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Palette size={14} /> {t('design')}
                </button>
                <button
                    onClick={() => setMode('moves')}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'moves'
                            ? 'bg-amber-500 text-bg shadow-lg'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Move size={14} /> {t('moves')}
                </button>
            </div>

            {/* History Toolbar */}
            <div className="flex gap-2">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-20 border border-white/10 rounded-xl text-white transition-all flex items-center justify-center gap-2"
                >
                    <Undo2 size={16} /> {t('undo')}
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-20 border border-white/10 rounded-xl text-white transition-all flex items-center justify-center gap-2"
                >
                    <Redo2 size={16} /> {t('redo')}
                </button>
            </div>

            {/* Save Button */}
            <button
                onClick={onSavePiece}
                disabled={isSaving}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-bg rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
            >
                {isSaving ? (
                    <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                ) : (
                    <>
                        <Save size={16} /> Save Piece
                    </>
                )}
            </button>

            {/* Piece Collection */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                        Pieces in Set
                    </h3>
                    <button
                        onClick={onCreateNewPiece}
                        className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1"
                    >
                        <Plus size={10} /> New Piece
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {pieces.map((piece) => (
                        <button
                            key={piece.id}
                            onClick={() => setSelectedPieceId(piece.id!)}
                            className={`p-3 rounded-xl border transition-all ${selectedPieceId === piece.id
                                    ? 'bg-amber-500/20 border-amber-500'
                                    : 'bg-white/5 border-white/10 hover:border-white/30'
                                }`}
                        >
                            <div className="aspect-square bg-black/20 rounded-lg mb-2 flex items-center justify-center">
                                <PieceRenderer
                                    type={piece.name}
                                    color={piece.color}
                                    size={40}
                                    pixels={piece.pixels}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-white truncate">{piece.name}</p>
                            <p className="text-[8px] text-white/40 capitalize">{piece.color}</p>
                        </button>
                    ))}
                </div>

                {pieces.length === 0 && (
                    <div className="text-center py-8 text-white/40 text-sm">
                        No pieces yet. Create your first piece!
                    </div>
                )}
            </div>

            {/* Delete Set */}
            {sets.length > 1 && (
                <button
                    onClick={handleDeleteSet}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-red-500/20"
                >
                    <Trash2 size={12} /> Delete Set
                </button>
            )}
        </div>
    );
}
