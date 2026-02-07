'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    useSensor,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    useSensors,
    PointerSensor,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, Save, Grid3x3, Trash2, X } from 'lucide-react';
import { getProjectAction, saveProjectAction } from '@/app/actions/editor';
import { Project } from '@/types/Project';
import { SquareLogicDefinition } from '@/types/firestore';

// Constants
const BLOCK_HEIGHT = 48;
const DEFAULT_WIDTH = 220;
const VARIABLE_WIDTH = 160;
const CONNECTOR_X = 24;
const CONNECTOR_Y = BLOCK_HEIGHT + 4;
const SNAP_X_TOLERANCE = 40;
const SNAP_Y_TOLERANCE = 40;
const SAVE_DEBOUNCE_MS = 3500;

// Types
type BlockCategory = 'trigger' | 'effects' | 'variables';

interface BlockTemplate {
    id: string;
    type: 'trigger' | 'effect' | 'terminal' | 'variable';
    label: string;
    category: BlockCategory;
    color: string;
    description: string;
    sockets?: SocketConfig[];
    width?: number;
}

interface SocketConfig {
    id: string;
    type: 'number' | 'text' | 'select';
    label?: string;
    options?: string[];
    acceptsVariable?: boolean;
    variableOnly?: boolean;
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

// Block Templates for Squares
const BLOCK_TEMPLATES: BlockTemplate[] = [
    {
        id: 'on-step',
        type: 'trigger',
        label: 'onStep',
        category: 'trigger',
        color: '#FFD700',
        description: 'Fires when a piece lands on this square.',
        sockets: [
            { id: 'pieceType', type: 'select', label: 'Type', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] },
            { id: 'pieceColor', type: 'select', label: 'Color', options: ['Any', 'White', 'Black'] }
        ],
        width: 320
    },
    {
        id: 'on-proximity',
        type: 'trigger',
        label: 'onProximity',
        category: 'trigger',
        color: '#FFD700',
        description: 'Fires when a piece is near this square.',
        sockets: [
            { id: 'distance', type: 'number', label: 'Distance', acceptsVariable: true }
        ],
        width: 240
    },
    {
        id: 'teleport',
        type: 'effect',
        label: 'teleport',
        category: 'effects',
        color: '#4169E1',
        description: 'Teleport the piece to another square.',
        sockets: [
            { id: 'targetSquare', type: 'text', label: 'to', acceptsVariable: true }
        ],
        width: 320
    },
    {
        id: 'kill',
        type: 'terminal',
        label: 'kill',
        category: 'effects',
        color: '#9370DB',
        description: 'Remove the piece from the board.',
        sockets: [],
        width: 140
    },
    {
        id: 'win',
        type: 'terminal',
        label: 'win',
        category: 'effects',
        color: '#9370DB', // MediumPurple
        description: 'Declare a win for a specific side.',
        sockets: [
            { id: 'side', type: 'select', label: 'Who', options: ['Trigger Side', 'White', 'Black'] }
        ],
        width: 200
    },
    {
        id: 'disable-square',
        type: 'effect',
        label: 'disableSquare',
        category: 'effects',
        color: '#FF4500',
        description: 'Make this square inactive.',
        width: 200
    },
    {
        id: 'enable-square',
        type: 'effect',
        label: 'enableSquare',
        category: 'effects',
        color: '#32CD32',
        description: 'Make this square active.',
        width: 200
    },
    {
        id: 'modify-var',
        type: 'effect',
        label: 'modVar',
        category: 'effects',
        color: '#4169E1',
        description: 'Modify a local square variable.',
        sockets: [
            { id: 'varName', type: 'text', acceptsVariable: true, variableOnly: true },
            { id: 'op', type: 'select', options: ['+=', '-=', '='] },
            { id: 'value', type: 'number', acceptsVariable: true }
        ],
        width: 440
    }
];

function getConnectorPosition(block: BlockInstance) {
    return {
        x: block.position.x + CONNECTOR_X,
        y: block.position.y + CONNECTOR_Y
    };
}

export default function SquareLogicPageClient({ projectId }: { projectId: string }) {
    const t = useTranslations('EditorSidebar');
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

    const [activeCategory, setActiveCategory] = useState<BlockCategory>('trigger');
    const [canvasBlocks, setCanvasBlocks] = useState<BlockInstance[]>([]);
    const [variables, setVariables] = useState<{ id: string, name: string, value: any }[]>([]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragTemplate, setActiveDragTemplate] = useState<BlockTemplate | null>(null);
    const [ghost, setGhost] = useState<GhostState | null>(null);
    const [isCreatingVar, setIsCreatingVar] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const [infoPanelBlock, setInfoPanelBlock] = useState<BlockInstance | null>(null);

    const activeTemplateRef = useRef<BlockTemplate | null>(null);
    const draggedDescendantsRef = useRef<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const lastSavedDataRef = useRef<string>('');
    const dragConnectorOffsetXRef = useRef<number>(CONNECTOR_X);

    const [isSelecting, setIsSelecting] = useState(false);

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            try {
                const result = await getProjectAction(projectId);
                if (result.success && result.data) {
                    setProject(result.data);
                }
            } catch (error) {
                console.error("Failed to load project:", error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [projectId]);

    useEffect(() => {
        if (!project || !selectedSquare) {
            setCanvasBlocks([]);
            setVariables([]);
            return;
        }
        const logicDef = project.squareLogic?.[selectedSquare];
        if (logicDef) {
            setCanvasBlocks(logicDef.logic || []);
            setVariables((logicDef as any).variables || []);
            lastSavedDataRef.current = JSON.stringify({ logic: logicDef.logic, variables: (logicDef as any).variables || [] });
        } else {
            setCanvasBlocks([]);
            setVariables([]);
            lastSavedDataRef.current = JSON.stringify({ logic: [], variables: [] });
        }
    }, [selectedSquare, project]);

    const handleSave = useCallback(async () => {
        if (!project || !selectedSquare || isSavingRef.current) return;

        const currentData = { logic: canvasBlocks, variables };
        if (JSON.stringify(currentData) === lastSavedDataRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const updatedSquareLogic = {
                ...(project.squareLogic || {}),
                [selectedSquare]: {
                    projectId,
                    squareId: selectedSquare,
                    logic: canvasBlocks,
                    variables,
                    updatedAt: new Date(),
                    userId: project.userId,
                    createdAt: project.squareLogic?.[selectedSquare]?.createdAt || new Date()
                }
            };

            const updatedProject: Project = {
                ...project,
                squareLogic: updatedSquareLogic as Record<string, SquareLogicDefinition>,
                updatedAt: new Date()
            };

            const serializeProjectForAction = (p: Project): any => {
                const serialized = { ...p };

                // Convert top-level dates
                if (serialized.createdAt instanceof Date) serialized.createdAt = serialized.createdAt.toISOString() as any;
                if (serialized.updatedAt instanceof Date) serialized.updatedAt = serialized.updatedAt.toISOString() as any;

                // Convert custom pieces dates
                if (serialized.customPieces) {
                    serialized.customPieces = serialized.customPieces.map(pc => ({
                        ...pc,
                        createdAt: pc.createdAt instanceof Date ? pc.createdAt.toISOString() : pc.createdAt,
                        updatedAt: pc.updatedAt instanceof Date ? pc.updatedAt.toISOString() : pc.updatedAt,
                    })) as any;
                }

                // Convert square logic dates
                if (serialized.squareLogic) {
                    const newSquareLogic: any = {};
                    for (const [key, val] of Object.entries(serialized.squareLogic)) {
                        newSquareLogic[key] = {
                            ...val,
                            createdAt: val.createdAt instanceof Date ? val.createdAt.toISOString() : (val.createdAt as any),
                            updatedAt: val.updatedAt instanceof Date ? val.updatedAt.toISOString() : (val.updatedAt as any)
                        };
                    }
                    serialized.squareLogic = newSquareLogic;
                }

                return serialized;
            };

            await saveProjectAction(serializeProjectForAction(updatedProject));
            setProject(updatedProject);
            lastSavedDataRef.current = JSON.stringify(currentData);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
            isSavingRef.current = false;
        }
    }, [canvasBlocks, variables, project, selectedSquare, projectId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSave();
        }, SAVE_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [canvasBlocks, variables, handleSave]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        draggedDescendantsRef.current.clear();

        // Measure actual DOM offset from container to SVG block
        const draggableElement = document.querySelector(`[data-id="${active.id}"]`);
        const svg = draggableElement?.querySelector('svg');

        if (svg && draggableElement) {
            const svgRect = svg.getBoundingClientRect();
            const containerRect = draggableElement.getBoundingClientRect();
            const blockOffsetInContainer = svgRect.left - containerRect.left;
            dragConnectorOffsetXRef.current = blockOffsetInContainer + CONNECTOR_X;
        } else {
            dragConnectorOffsetXRef.current = CONNECTOR_X;
        }

        let template = BLOCK_TEMPLATES.find(t => t.id === active.id);
        if (!template) {
            const variable = variables.find(v => v.id === active.id);
            if (variable) {
                template = {
                    id: variable.id,
                    type: 'variable',
                    label: variable.name,
                    category: 'variables',
                    color: '#FF8C00',
                    description: `Custom variable: ${variable.name}`
                };
            }
        }

        if (!template) {
            const instance = canvasBlocks.find(b => b.instanceId === active.id);
            if (instance) {
                setActiveDragTemplate(instance);
                activeTemplateRef.current = instance;
                const findDescendants = (id: string) => {
                    const child = canvasBlocks.find(b => b.parentId === id);
                    if (child) {
                        draggedDescendantsRef.current.add(child.instanceId);
                        findDescendants(child.instanceId);
                    }
                };
                findDescendants(instance.instanceId);
            }
        }

        if (template) {
            setActiveDragTemplate(template);
            activeTemplateRef.current = template;
        }
    };

    // Helper functions for connector positions
    const getBottomConnector = (block: BlockInstance) => ({
        x: block.position.x + CONNECTOR_X,
        y: block.position.y + CONNECTOR_Y
    });

    // Snap search helper
    const findBestSnap = (canvasX: number, canvasY: number, template: BlockTemplate): GhostState | null => {
        const childConnectorX = canvasX + dragConnectorOffsetXRef.current;

        for (const block of canvasBlocks) {
            if (block.type === 'variable' || block.childId || block.type === 'terminal') continue;
            if (template.type === 'trigger' || template.type === 'variable') continue;

            const parentBottom = getBottomConnector(block);
            const dx = Math.abs(childConnectorX - parentBottom.x);
            const dy = Math.abs(canvasY - parentBottom.y);

            if (dx < SNAP_X_TOLERANCE && dy < SNAP_Y_TOLERANCE) {
                return {
                    x: block.position.x + CONNECTOR_X - dragConnectorOffsetXRef.current,
                    y: block.position.y + BLOCK_HEIGHT,
                    parentId: block.instanceId,
                    template
                };
            }
        }
        return null;
    };

    // Throttle ref to limit drag over to 60fps
    const dragOverThrottleRef = useRef<number>(0);

    const handleDragOver = (event: DragOverEvent) => {
        const now = Date.now();
        if (now - dragOverThrottleRef.current < 16) return; // ~60fps
        dragOverThrottleRef.current = now;

        const { active, over } = event;
        const currentTemplate = activeDragTemplate || activeTemplateRef.current;
        if (!currentTemplate || !over || over.id !== 'canvas') {
            setGhost(null);
            return;
        }

        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();
        const rect = active.rect.current.translated ?? active.rect.current.initial;
        if (!rect) return;

        const dragX = rect.left - canvasRect.left + canvasElement.scrollLeft;
        const dragY = rect.top - canvasRect.top + canvasElement.scrollTop;

        // Try to snap during drag for consistent preview
        const snap = findBestSnap(dragX, dragY, currentTemplate);
        if (snap) {
            setGhost(snap);
        } else {
            setGhost({
                x: dragX,
                y: dragY,
                parentId: '',
                template: currentTemplate
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        const currentTemplate = activeDragTemplate || activeTemplateRef.current;

        setActiveDragId(null);
        setActiveDragTemplate(null);
        activeTemplateRef.current = null;
        setGhost(null);

        if (!currentTemplate) return;

        // Variable socket assignment logic
        if (over && over.data.current && over.data.current.type === 'socket' && currentTemplate.type === 'variable') {
            const { blockId, socketId } = over.data.current;
            setCanvasBlocks(prev => prev.map(b => {
                if (b.instanceId === blockId) {
                    return { ...b, socketValues: { ...b.socketValues, [socketId]: { type: 'variable', id: currentTemplate.id, name: currentTemplate.label } } };
                }
                return b;
            }));
            return;
        }

        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();

        // Use initial rect + delta for position calculation
        const initialRect = active.rect.current.initial;
        if (!initialRect) return;

        const currentLeft = initialRect.left + delta.x;
        const currentTop = initialRect.top + delta.y;

        const canvasX = currentLeft - canvasRect.left + canvasElement.scrollLeft;
        const canvasY = currentTop - canvasRect.top + canvasElement.scrollTop;

        // Use deterministic snap logic
        let bestSnap: GhostState | null = null;
        const childConnectorX = canvasX + dragConnectorOffsetXRef.current;

        for (const block of canvasBlocks) {
            if (block.instanceId === active.id) continue;
            if (draggedDescendantsRef.current.has(block.instanceId)) continue;
            if (block.childId) continue;
            if (block.type === 'terminal') continue;
            if (currentTemplate.type === 'trigger' || currentTemplate.type === 'variable') continue;

            const parentBottom = getBottomConnector(block);
            const dx = Math.abs(childConnectorX - parentBottom.x);
            const dy = Math.abs(canvasY - parentBottom.y);

            if (dx < SNAP_X_TOLERANCE && dy < SNAP_Y_TOLERANCE) {
                const targetX = block.position.x + CONNECTOR_X - dragConnectorOffsetXRef.current;

                bestSnap = {
                    x: targetX,
                    y: block.position.y + BLOCK_HEIGHT,
                    parentId: block.instanceId,
                    template: currentTemplate
                };
                break; // First valid snap wins
            }
        }

        const isExisting = canvasBlocks.some(b => b.instanceId === active.id);

        if (bestSnap) {
            if (isExisting) {
                setCanvasBlocks(prev => {
                    const oldBlock = prev.find(b => b.instanceId === active.id);
                    if (!oldBlock) return prev;
                    const dx = bestSnap!.x - oldBlock.position.x;
                    const dy = bestSnap!.y - oldBlock.position.y;
                    let updated = prev.map(b => b.childId === active.id ? { ...b, childId: undefined } : b);
                    updated = updated.map(b => b.instanceId === bestSnap!.parentId ? { ...b, childId: active.id as string } : b);
                    return updated.map(b => {
                        if (b.instanceId === active.id) {
                            return { ...b, position: { x: bestSnap!.x, y: bestSnap!.y }, parentId: bestSnap!.parentId };
                        }
                        if (draggedDescendantsRef.current.has(b.instanceId)) {
                            return { ...b, position: { x: b.position.x + dx, y: b.position.y + dy } };
                        }
                        return b;
                    });
                });
            } else {
                const newInstanceId = `instance-${Date.now()}`;
                const newBlock: BlockInstance = {
                    ...bestSnap.template,
                    instanceId: newInstanceId,
                    position: { x: bestSnap.x, y: bestSnap.y },
                    socketValues: {},
                    parentId: bestSnap.parentId
                };
                setCanvasBlocks(prev => {
                    const updated = prev.map(b => b.instanceId === bestSnap!.parentId ? { ...b, childId: newInstanceId } : b);
                    return [...updated, newBlock];
                });
            }
        } else {
            // Free drop (no snap)
            if (isExisting) {
                setCanvasBlocks(prev => {
                    const oldBlock = prev.find(b => b.instanceId === active.id);
                    if (!oldBlock) return prev;
                    const dx = canvasX - oldBlock.position.x;
                    const dy = canvasY - oldBlock.position.y;
                    let updated = prev.map(b => b.childId === active.id ? { ...b, childId: undefined } : b);
                    return updated.map(b => {
                        if (b.instanceId === active.id) {
                            return { ...b, position: { x: canvasX, y: canvasY }, parentId: undefined };
                        }
                        if (draggedDescendantsRef.current.has(b.instanceId)) {
                            return { ...b, position: { x: b.position.x + dx, y: b.position.y + dy } };
                        }
                        return b;
                    });
                });
            } else {
                const newBlock: BlockInstance = {
                    ...currentTemplate,
                    instanceId: `instance-${Date.now()}`,
                    position: { x: canvasX, y: canvasY },
                    socketValues: {}
                };
                setCanvasBlocks(prev => [...prev, newBlock]);
            }
        }
    };
    const createVariable = () => {
        if (!newVarName) return;
        const id = `var-${Date.now()}`;
        setVariables([...variables, { id, name: newVarName, value: 0 }]);
        setNewVarName('');
        setIsCreatingVar(false);
    };

    const deleteVariable = (id: string) => {
        setVariables(variables.filter(v => v.id !== id));
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0f1115] text-white">Loading...</div>;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex h-screen bg-[#0f1115] text-white overflow-hidden font-sans">
                {/* Sidebars and Main Area */}
                <div className="w-[60px] border-r border-white/5 bg-[#161920] flex flex-col items-center py-6 gap-8 z-30">
                    <button onClick={() => router.push(`/editor/${projectId}`)} className="p-2 bg-white/5 rounded-xl text-white/50 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    {(['trigger', 'effects', 'variables'] as BlockCategory[]).map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[10px] uppercase font-black transition-all ${activeCategory === cat ? 'text-blue-400 scale-110' : 'text-stone-500 hover:text-stone-300'}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                            {cat}
                        </button>
                    ))}
                    <button onClick={handleSave} disabled={isSaving} className={`p-3 rounded-xl transition-all ${isSaving ? 'text-amber-500 bg-amber-500/10' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}>
                        <Save size={20} className={isSaving ? 'animate-pulse' : ''} />
                    </button>
                </div>

                <div className="w-[300px] border-r border-white/5 bg-[#12141a] z-20 flex flex-col shadow-xl">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black">{activeCategory.toUpperCase()}</h2>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        {activeCategory === 'variables' ? (
                            <div className="space-y-6">
                                {variables.map(v => (
                                    <div key={v.id} className="group relative">
                                        <BlockTemplateItem template={{ id: v.id, type: 'variable', label: v.name, category: 'variables', color: '#FF8C00', description: `Var: ${v.name}` }} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteVariable(v.id); }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {isCreatingVar ? (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3">
                                        <input autoFocus value={newVarName} onChange={e => setNewVarName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createVariable()} placeholder="Variable name..." className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                                        <button onClick={createVariable} className="py-2 bg-orange-500 rounded-lg text-xs font-bold">Create</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsCreatingVar(true)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-stone-500 font-bold hover:border-orange-500/50 hover:text-orange-500 transition-all">+ New Variable</button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {BLOCK_TEMPLATES.filter(t => t.category === activeCategory).map(t => (
                                    <BlockTemplateItem key={t.id} template={t} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative bg-[#0c0e12]">
                    <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between z-10 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <span className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">Square:</span>
                            <span className="px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-sm shadow-[0_0_15px_rgba(59,130,246,0.1)] min-w-[60px] text-center">
                                {selectedSquare || 'None'}
                            </span>
                            <button
                                onClick={() => setIsSelecting(!isSelecting)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isSelecting ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}
                            >
                                {isSelecting ? 'Cancel' : 'Select Square'}
                            </button>
                        </div>
                        {selectedSquare && (
                            <button onClick={() => setCanvasBlocks([])} className="text-stone-500 hover:text-red-400 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-size-[40px_40px]">
                        <div id="canvas" className="absolute inset-0 overflow-auto custom-scrollbar">
                            <div className="relative w-[5000px] h-[5000px]">
                                {canvasBlocks.map(block => (
                                    <DraggableCanvasBlock key={block.instanceId} block={block}>
                                        <BlockComponent
                                            block={block}
                                            onDelete={() => setCanvasBlocks(prev => prev.filter(b => b.instanceId !== block.instanceId))}
                                            onUpdateSocket={(sid, val) => setCanvasBlocks(prev => prev.map(b => b.instanceId === block.instanceId ? { ...b, socketValues: { ...b.socketValues, [sid]: val } } : b))}
                                            onShowInfo={() => setInfoPanelBlock(block)}
                                        />
                                    </DraggableCanvasBlock>
                                ))}
                                {ghost && (
                                    <div className="absolute pointer-events-none opacity-50" style={{ left: `${ghost.x}px`, top: `${ghost.y}px` }}>
                                        <BlockComponent block={{ ...ghost.template, instanceId: 'ghost', position: { x: 0, y: 0 }, socketValues: {} }} isGhost />
                                    </div>
                                )}
                            </div>
                        </div>

                        {(!selectedSquare || isSelecting) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0e12]/80 backdrop-blur-md z-50 pointer-events-auto">
                                <div className="bg-[#161920] p-8 rounded-[40px] border border-white/10 shadow-2xl flex flex-col items-center gap-8 relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsSelecting(false); }}
                                        className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-white">Select Coordinate</h3>
                                        <p className="text-stone-500 text-sm mt-1 font-medium">Click on a square to edit its logic</p>
                                    </div>

                                    <div
                                        className="grid gap-1.5 p-4 bg-black/20 rounded-3xl border border-white/5"
                                        style={{
                                            gridTemplateColumns: `repeat(${project?.cols || 8}, minmax(0, 1fr))`,
                                            width: 'fit-content'
                                        }}
                                    >
                                        {project && Array.from({ length: project.rows * project.cols }).map((_, i) => {
                                            const row = project.rows - 1 - Math.floor(i / project.cols);
                                            const col = i % project.cols;
                                            const id = String.fromCharCode(97 + col) + (row + 1);
                                            // Explicitly making it active for now to debug, or ensuring logic is truly permissive
                                            const isActive = true;
                                            const isSelected = selectedSquare === id;

                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    disabled={!isActive}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedSquare(id);
                                                        setIsSelecting(false);
                                                    }}
                                                    className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center group relative z-10 ${!isActive ? 'bg-white/2 cursor-not-allowed opacity-20' :
                                                        isSelected ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] ring-4 ring-blue-500/20' :
                                                            'bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto'
                                                        }`}
                                                    title={id}
                                                >
                                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-stone-600 group-hover:text-stone-400'}`}>
                                                        {id}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsSelecting(false); }}
                                        className="text-xs font-bold text-stone-500 hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {mounted && createPortal(
                    <DragOverlay dropAnimation={null} zIndex={100}>
                        {activeDragTemplate ? (
                            <div className="opacity-80">
                                <BlockComponent block={{ ...activeDragTemplate, instanceId: 'overlay', position: { x: 0, y: 0 }, socketValues: {} }} />
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            `}</style>
        </DndContext >
    );
}

const DraggableCanvasBlock = React.memo(({ block, children }: { block: BlockInstance, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: block.instanceId,
        data: { block }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            data-id={block.instanceId}
            className={`absolute cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0 pointer-events-none' : 'pointer-events-auto'}`}
            style={{ left: `${block.position.x}px`, top: `${block.position.y}px`, zIndex: block.parentId ? 10 : 20 }}
        >
            {children}
        </div>
    );
}, (prev, next) => prev.block.instanceId === next.block.instanceId && prev.block.position.x === next.block.position.x && prev.block.position.y === next.block.position.y);

const BlockTemplateItem = React.memo(({ template }: { template: BlockTemplate }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({ id: template.id });
    const width = template.type === 'variable' ? VARIABLE_WIDTH : (template.width || DEFAULT_WIDTH);
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            data-id={template.id}
            className="cursor-grab active:cursor-grabbing"
            style={{ width: `${width}px` }}
        >
            <BlockComponent block={{ ...template, instanceId: 'template', position: { x: 0, y: 0 }, socketValues: {} }} />
        </div>
    );
}, (prev, next) => prev.template.id === next.template.id);

const BlockComponent = React.memo(({ block, isGhost, onDelete, onUpdateSocket, onShowInfo }: { block: any, isGhost?: boolean, onDelete?: () => void, onUpdateSocket?: (sid: string, val: any) => void, onShowInfo?: () => void }) => {
    const width = block.type === 'variable' ? VARIABLE_WIDTH : (block.width || DEFAULT_WIDTH);
    const height = BLOCK_HEIGHT;
    const notchX = CONNECTOR_X; // Using unified constant
    const notchW = 16;
    const r = 4; // Sharp LEGO-like corners

    const hasTopNotch = block.type !== 'trigger' && block.type !== 'variable';
    const hasBottomTab = block.type !== 'terminal' && block.type !== 'variable';

    // Build path starting from top-left (0,r)
    // 1. Top side + Notch
    let path = `M 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 `;
    if (hasTopNotch) {
        path += `H ${notchX} L ${notchX + 4} 4 H ${notchX + notchW - 4} L ${notchX + notchW} 0 `;
    }
    path += `H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r} `;

    // 2. Right side
    path += `V ${height - r} A ${r} ${r} 0 0 1 ${width - r} ${height} `;

    // 3. Bottom side + Tab
    if (hasBottomTab) {
        path += `H ${notchX + notchW} L ${notchX + notchW - 4} ${height + 4} H ${notchX + 4} L ${notchX} ${height} `;
    }
    path += `H ${r} A ${r} ${r} 0 0 1 0 ${height - r} Z`;

    return (
        <div className={`relative group ${isGhost ? 'opacity-40' : 'opacity-100'}`} style={{ width, height: height + 10 }}>
            <svg width={width} height={height + 10} className="drop-shadow-lg overflow-visible">
                <path d={path} fill={block.color} />
                <path d={path} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                {isGhost && <path d={path} fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />}
            </svg>
            <div className="absolute inset-0 flex items-center gap-3 select-none pointer-events-none" style={{ paddingLeft: `${CONNECTOR_X}px` }}>
                <span className="font-black text-[11px] text-black/80 uppercase tracking-tighter min-w-[40px]">{block.label}</span>
                <div className="flex-1 flex items-center gap-2 pointer-events-auto">
                    {block.sockets?.map((s: any) => (
                        <SocketComponent key={s.id} socket={s} block={block} onUpdateSocket={onUpdateSocket} />
                    ))}
                </div>
            </div>
            {onDelete && !isGhost && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-1 -right-1 bg-black/80 hover:bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all border border-white/10 shadow-xl z-20"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    );
}, (prev, next) =>
    prev.block.instanceId === next.block.instanceId &&
    prev.block.color === next.block.color &&
    prev.block.label === next.block.label &&
    prev.isGhost === next.isGhost &&
    JSON.stringify(prev.block.socketValues) === JSON.stringify(next.block.socketValues)
);

const SocketComponent = React.memo(({ socket, block, onUpdateSocket }: { socket: any, block: any, onUpdateSocket?: (sid: string, val: any) => void }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `socket-${block.instanceId}-${socket.id}`, data: { type: 'socket', blockId: block.instanceId, socketId: socket.id } });
    const val = block.socketValues?.[socket.id];
    const isVar = val && typeof val === 'object' && val.type === 'variable';

    return (
        <div ref={setNodeRef} className={`flex items-center gap-1 bg-black/10 rounded px-1.5 py-0.5 border ${isOver ? 'border-orange-500' : 'border-transparent'}`}>
            {socket.label && <span className="text-[8px] font-bold text-black/40 uppercase">{socket.label}</span>}
            {isVar ? (
                <div className="bg-orange-500 text-white rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1">
                    {val.name}
                    <button onClick={() => onUpdateSocket?.(socket.id, undefined)} className="hover:text-black">×</button>
                </div>
            ) : socket.type === 'select' ? (
                <select value={val || ''} onChange={e => onUpdateSocket?.(socket.id, e.target.value)} className="bg-transparent text-[10px] font-bold outline-none text-black">
                    <option value="">-</option>
                    {socket.options?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : (
                <input type={socket.type === 'number' ? 'number' : 'text'} value={val || ''} onChange={e => onUpdateSocket?.(socket.id, e.target.value)} className="bg-transparent text-[10px] font-bold outline-none w-10 text-black text-center" placeholder="..." />
            )}
        </div>
    );
}, (prev, next) =>
    prev.socket.id === next.socket.id &&
    prev.block.instanceId === next.block.instanceId &&
    JSON.stringify(prev.block.socketValues?.[prev.socket.id]) === JSON.stringify(next.block.socketValues?.[next.socket.id])
);
