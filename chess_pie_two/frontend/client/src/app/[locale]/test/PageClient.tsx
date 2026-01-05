'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    useSensor,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    useSensors,
    PointerSensor
} from '@dnd-kit/core';

// Types
type BlockCategory = 'Trigger' | 'Effects' | 'Variables';

interface BlockTemplate {
    id: string;
    type: 'trigger' | 'effect' | 'terminal' | 'variable';
    label: string;
    category: BlockCategory;
    color: string;
    description: string;
    sockets?: SocketConfig[];
    width?: number; // Optional predefined width
}

interface SocketConfig {
    id: string;
    type: 'number' | 'text' | 'select';
    label?: string;
    options?: string[];
}

interface BlockInstance extends BlockTemplate {
    instanceId: string;
    position: { x: number; y: number };
    socketValues: Record<string, any>;
    parentId?: string;
    childId?: string;
}

interface GhostState {
    x: number;
    y: number;
    parentId: string;
    template: BlockTemplate;
}

// Mock Templates
const BLOCK_TEMPLATES: BlockTemplate[] = [
    {
        id: 'on-capture',
        type: 'trigger',
        label: 'onCapture',
        category: 'Trigger',
        color: '#FFD700',
        description: 'Triggers when a piece is captured.',
        width: 140
    },
    {
        id: 'cooldown',
        type: 'effect',
        label: 'Cooldown',
        category: 'Effects',
        color: '#4169E1',
        description: 'Applies a cooldown to the piece.',
        sockets: [
            { id: 'duration', type: 'number', label: 'for' },
            { id: 'unit', type: 'select', options: ['seconds', 'half-moves', 'full-moves'] }
        ],
        width: 320
    },
    {
        id: 'charge',
        type: 'effect',
        label: 'Charge',
        category: 'Effects',
        color: '#4169E1',
        description: 'Charges an ability over multiple moves.',
        sockets: [
            { id: 'turns', type: 'number', label: 'moves' }
        ],
        width: 180
    },
    {
        id: 'transformation',
        type: 'effect',
        label: 'Transformation',
        category: 'Effects',
        color: '#4169E1',
        description: 'Changes the piece into another type.',
        sockets: [
            { id: 'target', type: 'select', options: ['Queen', 'Knight', 'Rook', 'Bishop'] }
        ],
        width: 280
    },
    {
        id: 'kill',
        type: 'terminal',
        label: 'Kill',
        category: 'Effects',
        color: '#9370DB',
        description: 'Immediately removes the piece from play.',
        width: 140 // Standardized smaller width
    }
];

export default function PageClient() {
    const [activeCategory, setActiveCategory] = useState<BlockCategory>('Trigger');
    const [canvasBlocks, setCanvasBlocks] = useState<BlockInstance[]>([]);
    const [variables, setVariables] = useState<{ id: string, name: string }[]>([]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragTemplate, setActiveDragTemplate] = useState<BlockTemplate | null>(null);
    const [ghost, setGhost] = useState<GhostState | null>(null);
    const [infoPanelBlock, setInfoPanelBlock] = useState<BlockInstance | null>(null);
    const [isCreatingVar, setIsCreatingVar] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const activeTemplateRef = useRef<BlockTemplate | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);

        let template = BLOCK_TEMPLATES.find(t => t.id === active.id);
        if (!template) {
            const variable = variables.find(v => v.id === active.id);
            if (variable) {
                template = {
                    id: variable.id,
                    type: 'variable',
                    label: variable.name,
                    category: 'Variables',
                    color: '#FF8C00',
                    description: `Custom variable: ${variable.name}`
                };
            }
        }

        if (template) {
            setActiveDragTemplate(template);
            activeTemplateRef.current = template;
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over, delta } = event;
        if (!activeDragTemplate || !over || over.id !== 'canvas') {
            setGhost(null);
            return;
        }

        const activator = event.activatorEvent as MouseEvent | TouchEvent;
        const clientX = 'clientX' in activator ? activator.clientX : (activator as TouchEvent).touches[0].clientX;
        const clientY = 'clientY' in activator ? activator.clientY : (activator as TouchEvent).touches[0].clientY;

        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) return;
        const rect = canvasElement.getBoundingClientRect();

        // Use clientX/Y which are the absolute mouse coordinates
        const dragX = clientX + delta.x - rect.left + canvasElement.scrollLeft;
        const dragY = clientY + delta.y - rect.top + canvasElement.scrollTop;

        let bestSnap: GhostState | null = null;
        let minDistance = 50;

        canvasBlocks.forEach(block => {
            if (block.type === 'variable' || block.childId || block.type === 'terminal') return;
            if (activeDragTemplate.type === 'trigger' || activeDragTemplate.type === 'variable') return;

            const snapX = block.position.x;
            const snapY = block.position.y + 50;

            const dist = Math.sqrt(Math.pow(dragX - snapX, 2) + Math.pow(dragY - snapY, 2));
            if (dist < minDistance) {
                minDistance = dist;
                bestSnap = {
                    x: snapX,
                    y: snapY,
                    parentId: block.instanceId,
                    template: activeDragTemplate
                };
            }
        });

        setGhost(bestSnap);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;

        // Capture current template and ghost before clearing state
        const currentTemplate = activeDragTemplate || activeTemplateRef.current;
        const currentGhost = ghost;

        // Clear all drag states
        setActiveDragId(null);
        setActiveDragTemplate(null);
        activeTemplateRef.current = null;
        setGhost(null);

        if (!currentTemplate) return;

        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();
        const activator = event.activatorEvent as MouseEvent | TouchEvent;

        // Get the starting mouse position
        const startX = 'clientX' in activator ? activator.clientX : (activator as TouchEvent).touches[0].clientX;
        const startY = 'clientY' in activator ? activator.clientY : (activator as TouchEvent).touches[0].clientY;

        // Calculate current mouse position using delta
        const currentMouseX = startX + (delta?.x || 0);
        const currentMouseY = startY + (delta?.y || 0);

        // Convert to canvas coordinates (same calculation as handleDragOver)
        const canvasX = currentMouseX - canvasRect.left + canvasElement.scrollLeft;
        const canvasY = currentMouseY - canvasRect.top + canvasElement.scrollTop;

        // Check if dropped within canvas boundaries
        if (currentMouseX < canvasRect.left || currentMouseX > canvasRect.right ||
            currentMouseY < canvasRect.top || currentMouseY > canvasRect.bottom) {
            return;
        }


        if (currentGhost) {
            // Snapped to another block
            const newInstanceId = `instance-${Date.now()}`;
            const newBlock: BlockInstance = {
                ...currentGhost.template,
                instanceId: newInstanceId,
                position: { x: currentGhost.x, y: currentGhost.y },
                socketValues: {},
                parentId: currentGhost.parentId
            };

            setCanvasBlocks(prev => {
                const updated = prev.map(b => b.instanceId === currentGhost.parentId ? { ...b, childId: newInstanceId } : b);
                return [...updated, newBlock];
            });
        } else {
            // Free placement - place block centered on mouse cursor
            const blockWidth = currentTemplate.width || 200;
            const newBlock: BlockInstance = {
                ...currentTemplate,
                instanceId: `instance-${Date.now()}`,
                position: {
                    x: canvasX - (blockWidth / 2),
                    y: canvasY - 25  // Center vertically (block height is 50)
                },
                socketValues: {}
            };
            setCanvasBlocks(prev => [...prev, newBlock]);
        }
    };

    const createVariable = () => {
        if (!newVarName) return;
        const id = `var-${Date.now()}`;
        setVariables([...variables, { id, name: newVarName }]);
        setNewVarName('');
        setIsCreatingVar(false);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-screen bg-[#0f1115] text-white overflow-hidden font-sans selection:bg-blue-500/30">
                {/* 1. CATEGORY SIDEBAR */}
                <div className="w-[60px] border-r border-white/5 bg-[#161920] flex flex-col items-center py-6 gap-8 z-30 shadow-2xl">
                    {(['Trigger', 'Effects', 'Variables'] as BlockCategory[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`
                                text-[10px] uppercase tracking-tighter font-black transition-all duration-300
                                ${activeCategory === cat ? 'text-blue-400 scale-110' : 'text-stone-500 hover:text-stone-300'}
                            `}
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* 2. BLOCK PALETTE SIDEBAR */}
                <div className="w-[340px] border-r border-white/5 bg-[#12141a] flex flex-col z-20 shadow-xl overflow-y-auto custom-scrollbar">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black text-white/90">{activeCategory}</h2>
                        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Block Palette</p>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        {activeCategory === 'Variables' ? (
                            <>
                                {variables.map(v => (
                                    <BlockTemplateItem
                                        key={v.id}
                                        template={{
                                            id: v.id,
                                            type: 'variable',
                                            label: v.name,
                                            category: 'Variables',
                                            color: '#FF8C00',
                                            description: `Custom variable: ${v.name}`
                                        }}
                                    />
                                ))}
                                <AnimatePresence>
                                    {isCreatingVar ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3"
                                        >
                                            <input
                                                autoFocus
                                                value={newVarName}
                                                onChange={e => setNewVarName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && createVariable()}
                                                placeholder="Variable name..."
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={createVariable} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-xs font-bold transition-colors">Create</button>
                                                <button onClick={() => setIsCreatingVar(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCreatingVar(true)}
                                            className="mt-2 py-3 px-4 border-2 border-dashed border-white/10 rounded-xl text-stone-500 hover:border-orange-500/50 hover:text-orange-500 transition-all font-bold text-sm bg-white/5"
                                        >
                                            + Create Variable
                                        </button>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col items-start">
                                {BLOCK_TEMPLATES.filter(t => t.category === activeCategory).map(template => (
                                    <div key={template.id} className="relative w-full h-[50px] group">
                                        {/* Background placeholder that always stays in the sidebar */}
                                        <div className="absolute inset-x-0 top-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-40">
                                            <BlockComponent
                                                block={{ ...template, instanceId: 'bg', position: { x: 0, y: 0 }, socketValues: {} }}
                                            />
                                        </div>
                                        {/* The actual draggable item */}
                                        <div className="absolute inset-x-0 top-0 z-10">
                                            <BlockTemplateItem template={template} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. MAIN CANVAS */}
                <Canvas
                    canvasBlocks={canvasBlocks}
                    ghost={ghost}
                    infoPanelBlock={infoPanelBlock}
                    setCanvasBlocks={setCanvasBlocks}
                    setInfoPanelBlock={setInfoPanelBlock}
                />

                <DragOverlay dropAnimation={null}>
                    {activeDragTemplate ? (
                        <div className="opacity-90 cursor-grabbing scale-105 transition-transform duration-200">
                            <BlockComponent block={{ ...activeDragTemplate, instanceId: 'overlay', position: { x: 0, y: 0 }, socketValues: {} }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </DndContext>
    );
}

import { useDraggable, useDroppable } from '@dnd-kit/core';

function Canvas({
    canvasBlocks,
    ghost,
    infoPanelBlock,
    setCanvasBlocks,
    setInfoPanelBlock
}: {
    canvasBlocks: BlockInstance[],
    ghost: GhostState | null,
    infoPanelBlock: BlockInstance | null,
    setCanvasBlocks: React.Dispatch<React.SetStateAction<BlockInstance[]>>,
    setInfoPanelBlock: React.Dispatch<React.SetStateAction<BlockInstance | null>>
}) {
    const { setNodeRef } = useDroppable({
        id: 'canvas',
    });

    return (
        <div
            id="canvas"
            ref={setNodeRef}
            className="flex-1 relative overflow-auto bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-size-[32px_32px] bg-[#0c0e12] custom-scrollbar"
        >
            <div className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none" />
            <div className="sticky top-0 left-0 w-full h-full pointer-events-none z-40">
                <div className="absolute inset-x-0 inset-y-0 border border-white/5 m-4 rounded-3xl" />
            </div>

            <div className="relative w-[5000px] h-[5000px]">
                {canvasBlocks.map(block => (
                    <div
                        key={block.instanceId}
                        className="absolute pointer-events-auto"
                        style={{ transform: `translate(${block.position.x}px, ${block.position.y}px)`, zIndex: block.parentId ? 10 : 20 }}
                    >
                        <BlockComponent
                            block={block}
                            onDelete={() => {
                                setCanvasBlocks(prev => {
                                    const toDelete = new Set([block.instanceId]);
                                    const findChildren = (id: string) => {
                                        const child = prev.find(b => b.parentId === id);
                                        if (child) {
                                            toDelete.add(child.instanceId);
                                            findChildren(child.instanceId);
                                        }
                                    };
                                    findChildren(block.instanceId);
                                    return prev.filter(b => !toDelete.has(b.instanceId)).map(b => b.childId === block.instanceId ? { ...b, childId: undefined } : b);
                                });
                            }}
                            onUpdateSocket={(sid, val) => {
                                setCanvasBlocks(prev => prev.map(b => b.instanceId === block.instanceId ? { ...b, socketValues: { ...b.socketValues, [sid]: val } } : b));
                            }}
                            onShowInfo={() => setInfoPanelBlock(block)}
                        />
                    </div>
                ))}

                <AnimatePresence>
                    {ghost && (
                        <div
                            className="absolute pointer-events-none"
                            style={{ transform: `translate(${ghost.x}px, ${ghost.y}px)`, zIndex: 5 }}
                        >
                            <BlockComponent block={{ ...ghost.template, instanceId: 'ghost', position: { x: 0, y: 0 }, socketValues: {} }} isGhost />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {infoPanelBlock && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 right-0 h-[260px] bg-[#1a1d26] border-t border-white/10 z-50 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    {infoPanelBlock.label}
                                    <span className="text-[10px] uppercase bg-white/5 px-2 py-1 rounded text-stone-500 tracking-tighter font-bold">Documentation</span>
                                </h3>
                                <p className="text-stone-400 mt-2 max-w-2xl">{infoPanelBlock.description}</p>
                            </div>
                            <button
                                onClick={() => setInfoPanelBlock(null)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-8">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Usage</h4>
                                <p className="text-sm italic text-stone-500">Wait for trigger event, then execute this effect.</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Example</h4>
                                <p className="text-sm font-mono text-blue-400">{infoPanelBlock.label} {"->"} NextBlock()</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BlockTemplateItem({ template }: { template: BlockTemplate }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: template.id,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing w-full"
        >
            <BlockComponent block={{ ...template, instanceId: 'template', position: { x: 0, y: 0 }, socketValues: {} }} />
        </div>
    );
}

function BlockComponent({
    block,
    isGhost = false,
    onDelete,
    onUpdateSocket,
    onShowInfo
}: {
    block: BlockInstance | (BlockTemplate & { instanceId: string; position: { x: number; y: number }; socketValues: any }),
    isGhost?: boolean,
    onDelete?: () => void,
    onUpdateSocket?: (socketId: string, value: any) => void,
    onShowInfo?: () => void
}) {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        hoverTimeoutRef.current = setTimeout(() => setShowTooltip(true), 3000);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setShowTooltip(false);
    };

    const getPath = () => {
        const w = block.width || (block.type === 'variable' ? 140 : 200);
        const h = 50;
        const r = 10; // Slightly more rounded
        const notchW = 22;
        const notchH = 8;
        const notchX = 15;

        if (block.type === 'trigger') {
            return `M 0 ${r} Q 0 0 ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${notchX + notchW} ${h} L ${notchX + notchW / 2 + notchH / 2} ${h + notchH} L ${notchX - notchH / 2 + notchW / 2} ${h + notchH} L ${notchX} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} Z`;
        }
        if (block.type === 'effect') {
            return `M 0 ${r} Q 0 0 ${r} 0 L ${notchX} 0 L ${notchX + notchH / 2} ${notchH} L ${notchX + notchW - notchH / 2} ${notchH} L ${notchX + notchW} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${notchX + notchW} ${h} L ${notchX + notchW / 2 + notchH / 2} ${h + notchH} L ${notchX - notchH / 2 + notchW / 2} ${h + notchH} L ${notchX} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} Z`;
        }
        if (block.type === 'terminal') {
            return `M 0 ${r} Q 0 0 ${r} 0 L ${notchX} 0 L ${notchX + notchH / 2} ${notchH} L ${notchX + notchW - notchH / 2} ${notchH} L ${notchX + notchW} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r / 2} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} Z`;
        }
        if (block.type === 'variable') {
            return `M ${h / 2} 0 L ${w - h / 2} 0 Q ${w} 0 ${w} ${h / 2} Q ${w} ${h} ${w - h / 2} ${h} L ${h / 2} ${h} Q 0 ${h} 0 ${h / 2} Q 0 0 ${h / 2} 0 Z`;
        }
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    };

    const width = block.width || (block.type === 'variable' ? 140 : 200);

    // Calculate the visual center offset for blocks with notches
    const hasNotch = block.type !== 'variable';
    const notchOffset = hasNotch ? 18 : 0; // Half of notch width to center content after notch

    return (
        <div
            className={`relative group filter drop-shadow-lg origin-center transition-all duration-200 ${isGhost ? 'opacity-30' : 'hover:scale-[1.02]'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => setShowTooltip(true)}
            style={{ width: `${width}px`, height: '50px' }}
        >
            <svg
                width={width + 40}
                height="70"
                viewBox={`-10 -10 ${width + 40} 90`}
                className="absolute -top-[10px] -left-[10px] pointer-events-none"
            >
                <path
                    d={getPath()}
                    fill={isGhost ? '#333' : block.color}
                    stroke={isGhost ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)'}
                    strokeWidth="1.5"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div
                    className="flex items-center gap-2.5 justify-center w-full"
                    style={{ marginLeft: `${notchOffset}px` }}
                >
                    <span className="font-bold text-white text-[14px] shadow-sm tracking-tight whitespace-nowrap">{block.label}</span>
                    <div className="flex items-center gap-2">
                        {block.sockets?.map(socket => (
                            <div key={socket.id} className="flex items-center gap-1.5 pointer-events-auto">
                                {socket.label && <span className="text-[10px] font-black uppercase text-white/40">{socket.label}</span>}
                                {socket.type === 'number' && (
                                    <div className="flex bg-black/30 rounded-lg border border-white/10 focus-within:ring-1 focus-within:ring-white/20 transition-all overflow-hidden">
                                        {block.socketValues[socket.id]?.type === 'variable' ? (
                                            <div className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[10px] font-black border-l-2 border-orange-500 flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-orange-500" />
                                                {block.socketValues[socket.id].name}
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                value={block.socketValues[socket.id] || ''}
                                                onChange={(e) => onUpdateSocket?.(socket.id, e.target.value)}
                                                className="w-12 bg-transparent text-white text-[11px] font-bold px-2 py-0.5 focus:outline-none text-center"
                                                placeholder="0"
                                            />
                                        )}
                                    </div>
                                )}
                                {socket.type === 'select' && (
                                    <select
                                        value={block.socketValues[socket.id] || socket.options?.[0]}
                                        onChange={(e) => onUpdateSocket?.(socket.id, e.target.value)}
                                        className="bg-black/30 text-white text-[10px] font-bold rounded-lg px-1 py-0.5 border border-white/10 focus:outline-none appearance-none cursor-pointer pr-4"
                                    >
                                        {socket.options?.map(opt => <option key={opt} value={opt} className="bg-[#1a1d26]">{opt}</option>)}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {!isGhost && block.instanceId !== 'template' && isHovered && (
                <div className="absolute top-1 right-2 flex gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                    <button onClick={onShowInfo} className="p-1 bg-black/40 hover:bg-black/60 rounded-md text-white/70 hover:text-white transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                    <button onClick={onDelete} className="p-1 bg-red-500/40 hover:bg-red-500/60 rounded-md text-white/70 hover:text-white transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            )}

            <AnimatePresence>
                {showTooltip && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full mb-3 left-0 w-max max-w-[200px] z-50 pointer-events-none">
                        <div className="bg-[#1a1d26] border border-white/10 px-4 py-2 rounded-xl shadow-2xl flex flex-col gap-1">
                            <p className="text-white text-xs font-bold leading-tight">{block.label}</p>
                            <p className="text-stone-400 text-[10px] leading-relaxed italic">{block.description}</p>
                        </div>
                        <div className="w-2 h-2 bg-[#1a1d26] border-r border-b border-white/10 rotate-45 ml-6 -mt-1.5" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

