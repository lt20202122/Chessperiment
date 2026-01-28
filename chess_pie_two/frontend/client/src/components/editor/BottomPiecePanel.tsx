'use client';

import { useState } from 'react';
import { Project } from '@/types/Project';
import { CustomPiece } from '@/types/firestore';
import { useTranslations } from 'next-intl';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { getPieceImage } from '@/app/[locale]/game/Data';
import PieceRenderer from '@/components/game/PieceRenderer';

interface BottomPiecePanelProps {
    project: Project;
}

const standardPieces = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

export default function BottomPiecePanel({ project }: BottomPiecePanelProps) {
    const t = useTranslations('BottomPiecePanel');
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedColor, setSelectedColor] = useState<'white' | 'black'>('white');

    const collapsedHeight = 20; // px
    const expandedHeight = window.innerHeight / 3; // 1/3 of screen height

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 transition-all duration-300 z-30 shadow-lg"
            style={{ height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px` }}
        >
            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-300 dark:bg-gray-700 rounded-full p-2 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors shadow-md"
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                ) : (
                    <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                )}
            </button>

            {isExpanded && (
                <div className="h-full overflow-y-auto p-4">
                    {/* Color Toggle */}
                    <div className="flex gap-2 mb-4 justify-center">
                        <button
                            onClick={() => setSelectedColor('white')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedColor === 'white'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('white')}
                        </button>
                        <button
                            onClick={() => setSelectedColor('black')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedColor === 'black'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('black')}
                        </button>
                    </div>

                    {/* Standard Pieces */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            {t('standardPieces')}
                        </h3>
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                            {standardPieces.map((piece) => (
                                <button
                                    key={piece}
                                    className="aspect-square bg-white dark:bg-gray-700 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('piece', JSON.stringify({ type: piece, color: selectedColor }));
                                    }}
                                >
                                    <div className="w-full h-full relative">
                                        <Image
                                            src={getPieceImage('modern', selectedColor, piece)}
                                            alt={piece}
                                            fill
                                            unoptimized
                                            className="object-contain"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Pieces */}
                    {project.customPieces.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                {t('customPieces')}
                            </h3>
                            <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                                {project.customPieces.map((piece, index) => (
                                    <button
                                        key={piece.id || index}
                                        className="aspect-square bg-white dark:bg-gray-700 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('piece', JSON.stringify({ type: piece.name, color: selectedColor, custom: true }));
                                        }}
                                    >
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PieceRenderer
                                                type={piece.name}
                                                color={selectedColor}
                                                size={40}
                                                pixels={selectedColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack}
                                            />
                                        </div>
                                        <span className="text-[8px] text-gray-600 dark:text-gray-400 mt-1 truncate w-full text-center">
                                            {piece.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
