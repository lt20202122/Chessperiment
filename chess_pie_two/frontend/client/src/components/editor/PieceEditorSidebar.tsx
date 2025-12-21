"use client"
import { Save, Upload, Download, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PieceEditorSidebarProps {
    selectedPiece: { type: string; color: string };
    setSelectedPiece: (piece: { type: string; color: string }) => void;
    pixels: string[][];
    setPixels: (pixels: string[][]) => void;
}

export default function PieceEditorSidebar({ selectedPiece, setSelectedPiece, pixels, setPixels }: PieceEditorSidebarProps) {
    const t = useTranslations('Editor.Piece');

    const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const colors = ['white', 'black'];

    const handleSave = () => {
        // implement save to database
        alert(t('saved'));
    };
    const handleLoad = () => {
        const saved = localStorage.getItem(`piece_${selectedPiece.color}_${selectedPiece.type}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            setSelectedPiece({ type: selectedPiece.type, color: selectedPiece.color });
            setPixels(parsed);
        }
    }
    const handleExport = () => {
        const dataStr = JSON.stringify(pixels);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${selectedPiece.color}_${selectedPiece.type}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                // Import logic would go here
                console.log('Import:', event.target?.result);
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="space-y-6">
            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all"
                >
                    <Save className="w-4 h-4" />
                    {t('save')}
                </button>

                <button
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    {t('publish')}
                </button>

                <button
                    onClick={handleImport}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all"
                >
                    <Upload className="w-4 h-4" />
                    {t('import')}
                </button>

                <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all"
                >
                    <Download className="w-4 h-4" />
                    {t('export')}
                </button>
                <button
                    onClick={handleLoad}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all"
                >
                    <Upload className="w-4 h-4" />

                    {t('loadFromDatabase')}
                </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 dark:border-stone-700"></div>

            {/* Piece Selector */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('selectPiece')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {colors.map(color => (
                        pieceTypes.map(type => (
                            <button
                                key={`${color}_${type}`}
                                onClick={() => setSelectedPiece({ type, color })}
                                className={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${selectedPiece.type === type && selectedPiece.color === color
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                                    : 'border-gray-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700'
                                    }`}
                            >
                                {color}_{type}
                            </button>
                        ))
                    ))}
                </div>
            </div>
        </div>
    );
}
