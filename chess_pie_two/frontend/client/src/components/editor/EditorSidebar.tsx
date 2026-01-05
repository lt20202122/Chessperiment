"use client";
import React from 'react';
import { Globe, Download, Share2, MousePointer, Move, LayoutGrid, UserCircle2, Swords, Library, Plus, Star, Trash2, X as CloseIcon } from 'lucide-react';
import { EditMode } from '@/app/[locale]/editor/board/PageClient';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';
import BoardStyle from '@/app/[locale]/game/BoardStyle';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import CleanUp from '@/components/editor/Cleanup';
import BoardPresets from './BoardPresets';
import { useSession } from 'next-auth/react';
import { saveBoardAction, getUserCustomPiecesAction } from '@/app/actions/library';
import { AnimatePresence, motion } from 'framer-motion';

import PieceRenderer from '@/components/game/PieceRenderer';

interface EditorSidebarProps {
    editMode: EditMode;
    setEditMode: (mode: EditMode) => void;
    selectedPiece: { type: string, color: string };
    setSelectedPiece: (piece: { type: string, color: string }) => void;
    boardStyle: string;
    setBoardStyle: (style: string) => void;
    generateBoardData: () => string;
    setBoard: any;
    onPresetChange?: (data: any) => void;
}

const pieceTypes = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

export default function EditorSidebar({ editMode, setEditMode, selectedPiece, setSelectedPiece, boardStyle, setBoardStyle, generateBoardData, setBoard, onPresetChange }: EditorSidebarProps) {
    const router = useRouter();
    const t = useTranslations('Editor.Board');
    const tg = useTranslations('Game');
    const { data: session } = useSession();
    const [copied, setCopied] = React.useState(false);
    const [isNamingModalOpen, setIsNamingModalOpen] = React.useState(false);
    const [boardName, setBoardName] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
    const [customCollection, setCustomCollection] = React.useState<Record<string, { name: string, color: 'white' | 'black', pixels: string[][], moves: any[] }>>({});

    React.useEffect(() => {
        const saved = localStorage.getItem('piece_collection');
        if (saved) {
            try {
                setCustomCollection(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse custom collection", e);
            }
        }
    }, []);

    const handlePieceSelect = (type: string, color: string) => {
        setSelectedPiece({ type, color });
    };

    const handleExport = () => {
        const boardData = generateBoardData();
        navigator.clipboard.writeText(boardData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveToLibrary = async () => {
        if (!session) {
            router.push('/login');
            return;
        }
        setIsNamingModalOpen(true);
    };

    const confirmSave = async () => {
        if (!boardName.trim() || isSaving || saveStatus === 'success') return;
        setIsSaving(true);
        try {
            const rawData = generateBoardData();
            const parsed = JSON.parse(rawData);

            await saveBoardAction({
                name: boardName,
                rows: parsed.rows,
                cols: parsed.cols,
                activeSquares: parsed.activeSquares,
                placedPieces: parsed.placedPieces
            });

            setSaveStatus('success');
            setTimeout(() => {
                setIsNamingModalOpen(false);
                setSaveStatus('idle');
                setBoardName('');
            }, 2000);
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col lg:h-full h-auto p-6 text-stone-900 dark:text-stone-100 overflow-y-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('badge')}</h2>
                <p className="text-stone-500 dark:text-white/40 text-sm mt-1">{t('actionsSub')}</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-stone-100 dark:bg-bg/50 border border-stone-200 dark:border-gray-200/20 rounded-xl mb-8">
                <button
                    onClick={() => setEditMode('shape')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${editMode === 'shape' ? 'bg-accent text-white shadow-md' : 'hover:bg-accent/10'}`}
                >
                    <LayoutGrid size={18} />
                    <span className="text-sm font-semibold text-nowrap">{t('shapeMode')}</span>
                </button>
                <button
                    onClick={() => setEditMode('pieces')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${editMode === 'pieces' ? 'bg-accent text-white shadow-md' : 'hover:bg-accent/10'}`}
                >
                    <UserCircle2 size={18} />
                    <span className="text-sm font-semibold text-nowrap">{t('piecesMode')}</span>
                </button>
            </div>

            {/* Piece Palette - Only visible in Pieces mode */}
            {editMode === 'pieces' && (
                <div className="mb-8 animate-in fade-in slide-in-from-left-2 duration-300">
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">
                        {t('selectPiece')}
                    </h3>

                    {/* All Pieces Grid - No Toggle! */}
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                        {/* White Pieces */}
                        {pieceTypes.map(type => (
                            <button
                                key={`white_${type}`}
                                onClick={() => handlePieceSelect(type, 'white')}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${selectedPiece.type === type && selectedPiece.color === 'white'
                                    ? 'bg-accent/10 border-accent shadow-sm'
                                    : 'bg-white dark:bg-bg/20 border-stone-200 dark:border-gray-200/10 hover:border-accent/40 hover:bg-accent/5'
                                    }`}
                            >
                                <div className="w-10 h-10 relative">
                                    <Image
                                        src={getPieceImage(boardStyle, 'white', type)}
                                        alt={type}
                                        fill
                                        unoptimized
                                        className="object-contain drop-shadow-sm bg-transparent"
                                    />
                                </div>
                            </button>
                        ))}
                        {/* Black Pieces */}
                        {pieceTypes.map(type => (
                            <button
                                key={`black_${type}`}
                                onClick={() => handlePieceSelect(type, 'black')}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${selectedPiece.type === type && selectedPiece.color === 'black'
                                    ? 'bg-accent/20 border-accent shadow-sm'
                                    : 'bg-white dark:bg-bg/20 border-stone-200 dark:border-gray-200/10 hover:border-accent/40 hover:bg-accent/5'
                                    }`}
                            >
                                <div className="w-10 h-10 relative">
                                    <Image
                                        src={getPieceImage(boardStyle, 'black', type)}
                                        alt={type}
                                        fill
                                        unoptimized
                                        className="object-contain drop-shadow-sm bg-transparent"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Custom Pieces Section Header */}
                    <div className="mt-8 flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
                            <Star size={14} className="text-amber-500" />
                            {t('customPieces' as any)}
                        </h3>
                        <button
                            onClick={async () => {
                                const libraryPieces = await getUserCustomPiecesAction();
                                if (libraryPieces.length > 0) {
                                    const collection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
                                    libraryPieces.forEach(p => {
                                        if (!collection[p.id!]) {
                                            collection[p.id!] = {
                                                name: p.name,
                                                color: p.color,
                                                pixels: p.pixels,
                                                moves: p.moves || []
                                            };
                                        }
                                    });
                                    localStorage.setItem('piece_collection', JSON.stringify(collection));
                                    setCustomCollection(collection);
                                }
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg transition-all"
                        >
                            <Plus size={10} /> {t('import' as any)}
                        </button>
                    </div>

                    {/* Custom Pieces Grid */}
                    {Object.keys(customCollection).length > 0 ? (
                        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                            {Object.entries(customCollection).map(([id, piece]) => (
                                <button
                                    key={id}
                                    onClick={() => handlePieceSelect(piece.name, piece.color)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${selectedPiece.type === piece.name && selectedPiece.color === piece.color
                                        ? 'bg-amber-500/20 border-amber-500 shadow-sm'
                                        : 'bg-white dark:bg-bg/20 border-stone-200 dark:border-gray-200/10 hover:border-amber-500/40 hover:bg-amber-500/5'
                                        }`}
                                >
                                    <div className="w-10 h-10 relative overflow-hidden rounded-lg bg-black/20 flex items-center justify-center">
                                        <PieceRenderer
                                            type={piece.name}
                                            color={piece.color}
                                            size={32}
                                            pixels={piece.pixels}
                                        />
                                        <span className="absolute inset-x-0 bottom-0 text-[8px] font-black bg-black/40 text-white/80 truncate px-1 text-center">
                                            {piece.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl border border-dashed border-white/5 text-center">
                            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{t('noCustomPieces' as any)}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Presets */}
            {onPresetChange && <BoardPresets onSelectPreset={onPresetChange} />}

            {/* Board Style Selector */}
            <div className="mb-8 border-t border-gray-200/20 pt-6 flex justify-around items-center gap-5">
                <div>

                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">Design</h3>
                    <BoardStyle currentStyle={boardStyle} onStyleChange={(style) => {
                        setBoardStyle(style);
                        localStorage.setItem('boardStyle', style);
                    }} />
                </div>
                <CleanUp
                    handleCleanup={() => {
                        setBoard({
                            rows: 8,
                            cols: 8,
                            placedPieces: {},
                            activeSquares: new Set<string>(),
                        })
                        localStorage.setItem("cols", "8")
                        localStorage.setItem("rows", "8")
                        localStorage.setItem("placedPieces", "{}")
                        localStorage.setItem("activeSquares", "[]")
                        window.location.reload()
                        console.log("Booard reseted")
                    }}
                />
            </div>

            {/* Actions Grid */}
            <div className="grid gap-3">
                <ActionButton
                    icon={<Globe size={18} />}
                    label={t('publish')}
                    sub={t('publishSub')}
                    className="bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md border border-green-400/20"
                />
                <ActionButton
                    icon={<Download size={18} />}
                    label={t('export')}
                    sub={t('exportSub')}
                    className="bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md border border-blue-400/20"
                    onClick={handleExport}
                    copied={copied}
                />
                <ActionButton
                    icon={<Swords size={18} />}
                    label={t('playYourself')}
                    sub={t('playYourselfSub')}
                    className="bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md border border-purple-400/20"
                    onClick={() => {
                        sessionStorage.setItem('board', generateBoardData());
                        router.push('/editor/board/play');
                    }}
                />
                <ActionButton
                    icon={<Library size={18} />}
                    label={saveStatus === 'success' ? t('saveSuccess' as any) : t('addToLibrary')}
                    sub={t('addToLibrarySub')}
                    className="bg-linear-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md border border-amber-400/20"
                    onClick={handleSaveToLibrary}
                />
            </div>

            {/* Naming Modal */}
            <AnimatePresence>
                {isNamingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsNamingModalOpen(false)}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                            >
                                <CloseIcon size={20} />
                            </button>

                            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('addToLibrary')}</h3>
                            <p className="text-stone-500 dark:text-white/60 text-sm mb-6">{t('namePrompt')}</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-white/40 mb-1.5 ml-1">
                                        {t('boardName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={boardName}
                                        onChange={(e) => setBoardName(e.target.value)}
                                        placeholder="e.g. My Custom Game"
                                        autoFocus
                                        className="w-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl px-4 py-3 text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
                                    />
                                </div>

                                <button
                                    onClick={confirmSave}
                                    disabled={!boardName.trim() || isSaving || saveStatus === 'success'}
                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isSaving
                                        ? 'bg-amber-500/50 cursor-not-allowed'
                                        : saveStatus === 'success'
                                            ? 'bg-green-500 text-white cursor-default'
                                            : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-bg'
                                        }`}
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                                    ) : saveStatus === 'success' ? (
                                        t('saveSuccess' as any)
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            {t('saveBoard' as any)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="mt-8 bg-stone-100 dark:bg-bg/50 rounded-xl p-4 border border-stone-200 dark:border-gray-200/20">
                <h4 className="font-semibold text-sm mb-2">{t('howToUse')}</h4>
                <ul className="text-sm opacity-80 space-y-2">
                    {editMode === 'shape' ? (
                        <>
                            <li className="flex gap-2 items-center">
                                <MousePointer size={16} className="text-gray-400" />
                                <span>{t('clickHelp')}</span>
                            </li>
                            <li className="flex gap-2 items-center">
                                <Move size={16} className="text-blue-400" />
                                <span>{t('dragHelp')}</span>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="flex gap-2 items-center">
                                <MousePointer size={16} className="text-accent" />
                                <span>{t('clickToPlace', { piece: tg(selectedPiece.type.toLowerCase() as any) })}</span>
                            </li>
                            <li className="flex gap-2 items-center">
                                <MousePointer size={16} className="text-red-400" />
                                <span>{t('rightClickToRemove')}</span>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}

function ActionButton({ label, sub, className, icon, onClick, copied }: { label: string, sub: string, className: string, icon: React.ReactNode, onClick?: () => void, copied?: boolean }) {
    return (
        <button onClick={onClick} className={`w-full p-3 rounded-xl text-left transition-all group relative overflow-hidden ${className}`}>
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <div className="text-white font-bold text-base">{copied ? 'Copied!' : label}</div>
                    <div className="text-white/70 text-[10px] font-medium">{sub}</div>
                </div>
                <div className="text-white/60 group-hover:text-white transition-transform">
                    {icon}
                </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-0" />
        </button>
    )
}
