"use client"
import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eraser, Paintbrush } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PixelCanvasProps {
    gridSize: number;
    pixels: string[][];
    setPixels: (pixels: string[][]) => void;
    commitPixels: (pixels: string[][]) => void;
    selectedPieceId: string;
}

export default function PixelCanvas({ gridSize, pixels, setPixels, commitPixels, selectedPieceId }: PixelCanvasProps) {
    const t = useTranslations('Editor.Piece');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [currentColor, setCurrentColor] = useState('#ffffff');
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [brushSize, setBrushSize] = useState(1);
    const startingPixelsRef = useRef<string[][] | null>(null);

    // Initialize pixel grid if empty
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

        const basePixelSize = 8; // Smaller base size for 64x64
        const pixelSize = basePixelSize * zoom;
        canvas.width = gridSize * pixelSize;
        canvas.height = gridSize * pixelSize;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pixels
        pixels.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            });
        });

        // Draw grid lines (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.5;
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

    const handleAction = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const basePixelSize = 8;
        const pixelSize = basePixelSize * zoom;
        const centerX = Math.floor((e.clientX - rect.left) / pixelSize);
        const centerY = Math.floor((e.clientY - rect.top) / pixelSize);

        if (centerX >= 0 && centerX < gridSize && centerY >= 0 && centerY < gridSize) {
            const newPixels = pixels.map(row => [...row]);
            const newColor = tool === 'brush' ? currentColor : 'transparent';

            const radius = Math.floor(brushSize / 2);
            const start = -(brushSize % 2 === 0 ? radius - 1 : radius);
            const end = radius;

            let changed = false;
            for (let dy = start; dy <= end; dy++) {
                for (let dx = start; dx <= end; dx++) {
                    const nx = centerX + dx;
                    const ny = centerY + dy;
                    if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                        if (newPixels[ny][nx] !== newColor) {
                            newPixels[ny][nx] = newColor;
                            changed = true;
                        }
                    }
                }
            }

            if (changed) {
                setPixels(newPixels);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        handleAction(e);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        startingPixelsRef.current = JSON.parse(JSON.stringify(pixels));
        handleAction(e);
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (startingPixelsRef.current) {
                const hasChanged = JSON.stringify(startingPixelsRef.current) !== JSON.stringify(pixels);
                if (hasChanged) {
                    console.log('🎨 Committing pixel changes for piece:', selectedPieceId);
                    commitPixels(pixels);
                }
            }
            startingPixelsRef.current = null;
        }
    };

    const handleClear = () => {
        const newPixels = Array(gridSize).fill(null).map(() =>
            Array(gridSize).fill('transparent')
        );
        commitPixels(newPixels);
    };

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-4 bg-stone-900/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTool('brush')}
                        className={`p-2.5 rounded-xl transition-all ${tool === 'brush'
                            ? 'bg-amber-500 text-bg shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        title="Brush"
                    >
                        <Paintbrush size={18} />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2.5 rounded-xl transition-all ${tool === 'eraser'
                            ? 'bg-amber-500 text-bg shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        title="Eraser"
                    >
                        <Eraser size={18} />
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                {/* Brush Size Slider */}
                <div className="flex items-center gap-3 px-2">
                    <div className="flex flex-col gap-1">
                        <input
                            type="range"
                            min="1"
                            max="8"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-24 accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                            <span>Size</span>
                            <span>{brushSize}px</span>
                        </div>
                    </div>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <div className="relative group">
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-white/5 p-1 border border-white/10 transition-transform active:scale-95"
                    />
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-black text-amber-500 w-12 text-center tabular-nums">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                        className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <button
                    onClick={handleClear}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    title="Clear Canvas"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Canvas Container */}
            <div className="group relative p-1 bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
                <div className="relative overflow-hidden rounded-2xl bg-[#1c1c1c]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className="cursor-crosshair block"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>

                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-500/50 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-500/50 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-500/50 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-500/50 rounded-br-lg" />
            </div>
        </div>
    );
}
