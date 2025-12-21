"use client"
import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eraser, Paintbrush } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PixelCanvasProps {
    gridSize: number;
    pixels: string[][];
    setPixels: (pixels: string[][]) => void;
    selectedPiece: { type: string; color: string };
}

export default function PixelCanvas({ gridSize, pixels, setPixels, selectedPiece }: PixelCanvasProps) {
    const t = useTranslations('Editor.Piece');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

    // Initialize pixel grid
    useEffect(() => {
        if (pixels.length === 0) {
            const newPixels = Array(gridSize).fill(null).map(() =>
                Array(gridSize).fill('transparent')
            );
            setPixels(newPixels);
        }
    }, [gridSize, pixels.length, setPixels]);

    // Draw grid on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || pixels.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelSize = 16 * zoom;
        canvas.width = gridSize * pixelSize;
        canvas.height = gridSize * pixelSize;

        // Draw pixels
        pixels.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            });
        });

        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * pixelSize, 0);
            ctx.lineTo(i * pixelSize, gridSize * pixelSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * pixelSize);
            ctx.lineTo(gridSize * pixelSize, i * pixelSize);
            ctx.stroke();
        }
    }, [pixels, gridSize, zoom]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (16 * zoom));
        const y = Math.floor((e.clientY - rect.top) / (16 * zoom));

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            const newPixels = [...pixels];
            newPixels[y][x] = tool === 'brush' ? currentColor : 'transparent';
            setPixels(newPixels);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        handleCanvasClick(e);
    };

    const handleClear = () => {
        const newPixels = Array(gridSize).fill(null).map(() =>
            Array(gridSize).fill('transparent')
        );
        setPixels(newPixels);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-xl">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTool('brush')}
                        className={`p-2 rounded-lg transition-all ${tool === 'brush'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700'
                            }`}
                    >
                        <Paintbrush className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded-lg transition-all ${tool === 'eraser'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700'
                            }`}
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-stone-700"></div>

                <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                />

                <div className="w-px h-6 bg-gray-300 dark:bg-stone-700"></div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 transition-all"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 transition-all"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-stone-700"></div>

                <button
                    onClick={handleClear}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-950/20 hover:bg-red-200 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Canvas */}
            <div className="p-6 bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-2xl shadow-lg">
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={() => setIsDrawing(true)}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onMouseMove={handleMouseMove}
                    className="cursor-crosshair"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            {/* Info */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('editing')}: <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedPiece.color}_{selectedPiece.type}</span>
            </div>
        </div>
    );
}
