"use client";
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Undo2, Redo2, Type, Box, Loader2, Palette, ChevronDown, Check, Move, RefreshCw, HelpCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { PieceSet, CustomPiece } from '@/types/firestore';
import PieceRenderer from '@/components/game/PieceRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PieceEditorSidebarProps {
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
    onDeletePiece: (id: string) => void;
    onGenerateInvertedPiece: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PieceEditorSidebar({
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
    canRedo,
    onDeletePiece,
    onGenerateInvertedPiece,
    onImageUpload
}: PieceEditorSidebarProps) {
    const t = useTranslations('Editor.Piece');
    const locale = useLocale();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pieceId: string } | null>(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPieceId) {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
                e.preventDefault();
                onDeletePiece(selectedPieceId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPieceId, onDeletePiece]);

    const handleContextMenu = (e: React.MouseEvent, pieceId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, pieceId });
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-8">
            <div className="mb-10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                            {t('sidebarTitle')}
                        </h2>
                        <Link href={`/${locale}/editor`} target="_blank" className="p-1.5 rounded-xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-400 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-sm" title="Help">
                            <HelpCircle size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Piece Settings */}
            <div className="space-y-6 mb-10 shrink-0">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                        {t('pieceName')}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={currentName}
                            onChange={(e) => setCurrentName(e.target.value)}
                            onBlur={() => onSavePiece()}
                            placeholder="e.g. Shadow Knight"
                            className="w-full bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold shadow-xs tabular-nums"
                        />
                    </div>
                </div>

                {/* Color Toggle for Design Editing */}
                <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                        Edit Design Version
                    </label>
                    <div className="flex gap-2 p-1 bg-stone-100 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 shadow-inner">
                        <button
                            onClick={() => setCurrentColor('white')} // Reverted to original functionality
                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${currentColor === 'white' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-400 dark:text-white/20 hover:text-stone-600'}`}
                        >
                            <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" /> {t('white')}
                        </button>
                        <button
                            onClick={() => setCurrentColor('black')}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${currentColor === 'black' ? 'bg-stone-900 text-white shadow-sm border border-stone-700' : 'text-stone-400 dark:text-white/20 hover:text-stone-600'}`}
                        >
                            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" /> {t('black')}
                        </button>
                    </div>
                </div>

                {selectedPieceId && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onGenerateInvertedPiece();
                        }}
                        className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white dark:text-bg rounded-3xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                    >
                        <RefreshCw size={18} /> {t('invert')}
                    </motion.button>
                )}

                {selectedPieceId && (
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                            {t('imageUploadLabel')}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onImageUpload}
                            className="hidden"
                            id="piece-image-upload"
                        />
                        <label
                            htmlFor="piece-image-upload"
                            className="w-full py-4 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
                        >
                            <Palette size={14} /> {t('uploadPicture')}
                        </label>
                    </div>
                )}
            </div>

            {/* Mode Toggle (Design vs Moves) */}
            <div className="bg-stone-100 dark:bg-white/5 p-1.5 rounded-2xl border border-stone-200 dark:border-white/10 flex gap-1 shadow-inner mb-6 shrink-0">
                <button
                    onClick={() => setMode('design')}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'design'
                        ? 'bg-amber-500 text-white dark:text-bg shadow-md'
                        : 'text-stone-500 dark:text-white/20 hover:text-stone-700 dark:hover:text-white'
                        }`}
                >
                    <Palette size={14} /> {t('design')}
                </button>
                <button
                    onClick={() => setMode('moves')}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'moves'
                        ? 'bg-amber-500 text-white dark:text-bg shadow-md'
                        : 'text-stone-500 dark:text-white/20 hover:text-stone-700 dark:hover:text-white'
                        }`}
                >
                    <Move size={14} /> {t('moves')}
                </button>
            </div>

            {/* History Toolbar */}
            <div className="flex gap-2 mb-10 shrink-0">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="flex-1 p-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-600 dark:text-white disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/10 transition-all flex items-center justify-center shadow-sm"
                    title={t('undo')}
                >
                    <Undo2 size={18} />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex-1 p-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-600 dark:text-white disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/10 transition-all flex items-center justify-center shadow-sm"
                    title={t('redo')}
                >
                    <Redo2 size={18} />
                </button>
            </div>

            {/* Pieces in Set */}
            <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                    <h3 className="text-[10px] font-black text-stone-900 dark:text-white/30 uppercase tracking-widest">
                        {t('totalPieces', { count: pieces.length })}
                    </h3>
                    <button
                        onClick={onCreateNewPiece}
                        className="text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                        <Plus size={12} /> {t('addNew')}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-6">
                    <AnimatePresence mode="popLayout">
                        {pieces.map((piece) => (
                            <motion.div
                                key={piece.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col gap-1.5"
                            >
                                <button
                                    onClick={() => setSelectedPieceId(piece.id!)}
                                    onContextMenu={(e) => handleContextMenu(e, piece.id!)}
                                    className={`group aspect-square relative flex items-center justify-center rounded-2xl border transition-all overflow-hidden ${selectedPieceId === piece.id
                                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                                        : 'bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 hover:border-amber-500/50'
                                        }`}
                                >
                                    <motion.div
                                        animate={selectedPieceId === piece.id ? { scale: 1.15 } : { scale: 1 }}
                                        className="transform"
                                    >
                                        <PieceRenderer
                                            type={piece.name}
                                            color={currentColor}
                                            size={32}
                                            pixels={currentColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack}
                                            image={currentColor === 'white' ? piece.imageWhite : piece.imageBlack}
                                        />
                                    </motion.div>
                                    <div className={`absolute bottom-0 inset-x-0 h-1 transition-colors ${selectedPieceId === piece.id ? 'bg-amber-500' : 'bg-transparent group-hover:bg-amber-500/30'}`} />
                                </button>
                                <div className="text-center px-1 pb-1">
                                    <p className={`text-[10px] font-black uppercase tracking-tight transition-colors ${selectedPieceId === piece.id ? 'text-amber-500' : 'text-stone-400 dark:text-white/20'}`}>
                                        {piece.name}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {pieces.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-12 bg-stone-50 dark:bg-white/5 rounded-3xl border border-dashed border-stone-200 dark:border-white/10 flex flex-col items-center justify-center text-stone-900 dark:text-white/10"
                        >
                            <Box size={32} className="mb-3" />
                            <p className="text-[10px] font-black text-stone-900 dark:text-white/10 uppercase tracking-widest">{t('noPieces')}</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-8 space-y-3 shrink-0">
                <button
                    onClick={() => onSavePiece()}
                    disabled={isSaving}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white dark:text-bg py-5 rounded-4xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                    {isSaving ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    {t('save')}
                </button>

                {selectedPieceId && (
                    <button
                        onClick={() => onDeletePiece(selectedPieceId)}
                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-400 dark:text-white/20 hover:text-red-500 hover:border-red-500/50`}
                    >
                        <Trash2 size={14} />
                        {t('deletePiece')} {/* Reverted to original text */}
                    </button>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-9999"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            onDeletePiece(contextMenu.pieceId);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        {t('delete')}
                    </button>
                </div>
            )}
        </div>
    );
}
