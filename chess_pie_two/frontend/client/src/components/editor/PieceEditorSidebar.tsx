"use client";
import React, { useState } from 'react';
import { Save, Plus, Trash2, Undo2, Redo2, Type, Box, Loader2, Palette, ChevronDown, Check, Move } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PieceSet, CustomPiece } from '@/lib/firestore';
import PieceRenderer from '@/components/game/PieceRenderer';

interface PieceEditorSidebarProps {
    sets: (PieceSet & { id: string })[];
    currentSetId: string | null;
    setCurrentSetId: (id: string) => void;
    pieces: (CustomPiece & { id: string })[];
    selectedPieceId: string | null;
    setSelectedPieceId: (id: string) => void;
    onCreateNewPiece: () => void;
    onCreateNewSet: () => void;
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
    onDeletePiece: (id: string) => void;
}

export default function PieceEditorSidebar({
    sets,
    currentSetId,
    setCurrentSetId,
    pieces,
    selectedPieceId,
    setSelectedPieceId,
    onCreateNewPiece,
    onCreateNewSet,
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
    canRedo,
    onDeletePiece
}: PieceEditorSidebarProps) {
    const t = useTranslations('Editor.Piece');
    const [isDeleting, setIsDeleting] = useState(false);

    const activeSet = sets.find(s => s.id === currentSetId);

    return (
        <div className="flex flex-col h-full bg-islands dark:bg-stone-900 overflow-y-auto custom-scrollbar p-8">
            {/* Header / Active Set */}
            <div className="mb-10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        {t('sidebarTitle')}
                    </h2>
                    <div className="relative group/sets">
                        <button
                            className="p-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white dark:hover:text-bg transition-all active:scale-95 flex items-center gap-2"
                            title="Switch Set"
                        >
                            <Box size={20} />
                            <ChevronDown size={14} className="group-hover/sets:rotate-180 transition-transform" />
                        </button>

                        {/* Dropdown Menu - now stays open when hovering over it */}
                        <div className="absolute right-0 top-full pt-2 w-64 opacity-0 translate-y-2 pointer-events-none group-hover/sets:opacity-100 group-hover/sets:translate-y-0 group-hover/sets:pointer-events-auto transition-all z-50">
                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                <div className="p-4 border-b border-stone-100 dark:border-white/10">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Select Collection</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {sets.map(set => (
                                        <button
                                            key={set.id}
                                            onClick={() => setCurrentSetId(set.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors text-left ${currentSetId === set.id ? 'bg-amber-500/10 text-amber-500' : 'text-stone-900 dark:text-white'}`}
                                        >
                                            <span className="text-sm font-bold truncate">{set.name}</span>
                                            {currentSetId === set.id && <Check size={14} />}
                                        </button>
                                    ))}
                                    <button
                                        onClick={onCreateNewSet}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-amber-500 hover:bg-amber-500/10 transition-colors border-t border-stone-100 dark:border-white/10"
                                    >
                                        <Plus size={16} />
                                        <span className="text-sm font-black uppercase tracking-widest">New Set</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {activeSet ? (
                    <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <Box size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-stone-900 dark:text-white/30 uppercase tracking-widest leading-none mb-1">Active Set</p>
                            <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate uppercase tracking-tight">
                                {activeSet.name}
                            </h3>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-stone-100 dark:bg-white/5 border border-dashed border-stone-300 dark:border-white/10 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-stone-900 dark:text-white/20 uppercase tracking-widest">No set selected</p>
                    </div>
                )}
            </div>

            {/* Piece Settings */}
            <div className="space-y-6 mb-10 shrink-0">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                        Piece Name
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={currentName}
                            onChange={(e) => setCurrentName(e.target.value)}
                            placeholder="e.g. Shadow Knight"
                            className="w-full bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold shadow-xs"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                        Piece Color
                    </label>
                    <div className="flex p-1.5 bg-stone-100 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-inner">
                        <button
                            onClick={() => setCurrentColor('white')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${currentColor === 'white'
                                ? 'bg-white text-stone-900 shadow-lg'
                                : 'text-stone-500 hover:text-stone-700 dark:text-white/20 dark:hover:text-white/40'}`}
                        >
                            White
                        </button>
                        <button
                            onClick={() => setCurrentColor('black')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${currentColor === 'black'
                                ? 'bg-stone-900 text-white shadow-lg'
                                : 'text-stone-500 hover:text-stone-700 dark:text-white/20 dark:hover:text-white/40'}`}
                        >
                            Black
                        </button>
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="bg-stone-100 dark:bg-white/5 p-1.5 rounded-2xl border border-stone-200 dark:border-white/10 flex gap-1 shadow-inner mb-6 shrink-0">
                <button
                    onClick={() => setMode('design')}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'design'
                        ? 'bg-amber-500 text-white dark:text-bg shadow-md'
                        : 'text-stone-500 dark:text-white/20 hover:text-stone-700 dark:hover:text-white'
                        }`}
                >
                    <Palette size={14} /> Design
                </button>
                <button
                    onClick={() => setMode('moves')}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'moves'
                        ? 'bg-amber-500 text-white dark:text-bg shadow-md'
                        : 'text-stone-500 dark:text-white/20 hover:text-stone-700 dark:hover:text-white'
                        }`}
                >
                    <Move size={14} /> Rules
                </button>
            </div>

            {/* History Toolbar */}
            <div className="flex gap-2 mb-10 shrink-0">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="flex-1 p-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-600 dark:text-white disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/10 transition-all flex items-center justify-center shadow-sm"
                >
                    <Undo2 size={18} />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex-1 p-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-600 dark:text-white disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/10 transition-all flex items-center justify-center shadow-sm"
                >
                    <Redo2 size={18} />
                </button>
            </div>

            {/* Pieces in Set */}
            <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                    <h3 className="text-[10px] font-black text-stone-900 dark:text-white/30 uppercase tracking-widest">
                        Pieces in Set ({pieces.length})
                    </h3>
                    <button
                        onClick={onCreateNewPiece}
                        className="text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                        <Plus size={12} /> Add New
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-6">
                    {pieces.map((piece) => (
                        <button
                            key={piece.id}
                            onClick={() => setSelectedPieceId(piece.id!)}
                            className={`group aspect-square relative flex items-center justify-center rounded-2xl border transition-all overflow-hidden ${selectedPieceId === piece.id
                                ? 'bg-amber-500/10 border-amber-500 shadow-md'
                                : 'bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 hover:border-amber-500/50'
                                }`}
                        >
                            <div className="transform group-hover:scale-110 transition-transform duration-500">
                                <PieceRenderer
                                    type={piece.name}
                                    color={piece.color}
                                    size={32}
                                    pixels={piece.pixels}
                                />
                            </div>
                            <div className={`absolute bottom-0 inset-x-0 h-1 transition-colors ${selectedPieceId === piece.id ? 'bg-amber-500' : 'bg-transparent group-hover:bg-amber-500/30'}`} />
                        </button>
                    ))}

                    {pieces.length === 0 && (
                        <div className="col-span-full py-12 bg-stone-50 dark:bg-white/5 rounded-3xl border border-dashed border-stone-200 dark:border-white/10 flex flex-col items-center justify-center text-stone-900 dark:text-white/10">
                            <Box size={32} className="mb-3" />
                            <p className="text-[10px] font-black text-stone-900 dark:text-white/10 uppercase tracking-widest">No pieces yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-8 space-y-3 shrink-0">
                <button
                    onClick={onSavePiece}
                    disabled={isSaving}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white dark:text-bg py-5 rounded-4xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                    {isSaving ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                    )}
                    {t('save')}
                </button>

                {selectedPieceId && (
                    <button
                        onClick={() => {
                            if (isDeleting) {
                                onDeletePiece(selectedPieceId);
                                setIsDeleting(false);
                            } else {
                                setIsDeleting(true);
                                setTimeout(() => setIsDeleting(false), 3000);
                            }
                        }}
                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${isDeleting
                            ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-400 dark:text-white/20 hover:text-red-500 hover:border-red-500/50'}`}
                    >
                        <Trash2 size={14} />
                        {isDeleting ? 'Click again to confirm' : 'Delete piece'}
                    </button>
                )}
            </div>
        </div>
    );
}
