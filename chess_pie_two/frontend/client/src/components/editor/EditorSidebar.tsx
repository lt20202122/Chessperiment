import React from 'react';
import { Globe, Download, Share2, MousePointer, Move, LayoutGrid, UserCircle2 } from 'lucide-react';
import { EditMode } from '@/app/[locale]/editor/board/PageClient';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';
import BoardStyle from '@/app/[locale]/game/BoardStyle';
import { useTranslations } from 'next-intl';

interface EditorSidebarProps {
    editMode: EditMode;
    setEditMode: (mode: EditMode) => void;
    selectedPiece: { type: string, color: string };
    setSelectedPiece: (piece: { type: string, color: string }) => void;
    boardStyle: string;
    setBoardStyle: (style: string) => void;
}

const pieceTypes = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

export default function EditorSidebar({ editMode, setEditMode, selectedPiece, setSelectedPiece, boardStyle, setBoardStyle }: EditorSidebarProps) {
    const t = useTranslations('Editor.Board');
    const tg = useTranslations('Game');

    const handlePieceSelect = (type: string, color: string) => {
        setSelectedPiece({ type, color });
    };

    return (
        <div className="flex flex-col lg:h-full h-auto p-6 text-text overflow-y-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">{t('badge')}</h2>
                <p className="opacity-70 text-sm mt-1">{t('actionsSub')}</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-bg/50 border border-gray-200/20 rounded-xl mb-8">
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
                                    : 'bg-bg/20 border-gray-200/10 hover:border-accent/40 hover:bg-accent/5'
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
                                    : 'bg-bg/20 border-gray-200/10 hover:border-accent/40 hover:bg-accent/5'
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
                </div>
            )}

            {/* Board Style Selector */}
            <div className="mb-8 border-t border-gray-200/20 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">Design</h3>
                <BoardStyle currentStyle={boardStyle} onStyleChange={(style) => {
                    setBoardStyle(style);
                    localStorage.setItem('boardStyle', style);
                }} />
            </div>

            {/* Actions Grid */}
            <div className="grid gap-3">
                <ActionButton
                    icon={<Globe size={18} />}
                    label={t('publish')}
                    sub={t('publishSub')}
                    className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md border border-green-400/20"
                />
                <ActionButton
                    icon={<Download size={18} />}
                    label={t('export')}
                    sub={t('exportSub')}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md border border-blue-400/20"
                />
            </div>

            <div className="mt-auto bg-bg/50 rounded-xl p-4 border border-gray-200/20 mt-8">
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

function ActionButton({ label, sub, className, icon }: { label: string, sub: string, className: string, icon: React.ReactNode }) {
    return (
        <button className={`w-full p-3 rounded-xl text-left transition-all group relative overflow-hidden ${className}`}>
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <div className="text-white font-bold text-base">{label}</div>
                    <div className="text-white/70 text-[10px] font-medium">{sub}</div>
                </div>
                <div className="text-white/60 group-hover:text-white transition-transform">
                    {icon}
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-0" />
        </button>
    )
}
