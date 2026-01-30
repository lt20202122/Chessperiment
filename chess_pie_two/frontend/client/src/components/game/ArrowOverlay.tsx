'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Arrow {
  from: string;
  to: string;
  id: string;
}

interface ArrowOverlayProps {
  boardSize: number;
  squareSize: number;
  isPlayerWhite?: boolean;
  onArrowsChange?: (arrows: Arrow[]) => void;
  disabled?: boolean;
}

/**
 * ArrowOverlay component for drawing directional arrows on a chess board
 * - Right-click and drag to draw arrows
 * - Smooth curved arrows with arrowhead markers
 * - High visual quality with proper opacity and colors
 */
export default function ArrowOverlay({
  boardSize,
  squareSize,
  isPlayerWhite = true,
  onArrowsChange,
  disabled = false,
}: ArrowOverlayProps) {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [drawingArrow, setDrawingArrow] = useState<{ from: string; mouseX: number; mouseY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);

  // Convert board position (e.g., "e4") to pixel coordinates
  const positionToCoordinates = useCallback((position: string): { x: number; y: number } => {
    const file = position.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = parseInt(position[1]) - 1; // 1=0, 2=1, ..., 8=7
    
    // Adjust for board orientation
    const visualFile = isPlayerWhite ? file : 7 - file;
    const visualRank = isPlayerWhite ? 7 - rank : rank;
    
    // Center of the square
    const x = visualFile * squareSize + squareSize / 2;
    const y = visualRank * squareSize + squareSize / 2;
    
    return { x, y };
  }, [squareSize, isPlayerWhite]);

  // Convert pixel coordinates to board position
  const coordinatesToPosition = useCallback((x: number, y: number): string | null => {
    const file = Math.floor(x / squareSize);
    const rank = Math.floor(y / squareSize);
    
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    
    // Adjust for board orientation
    const boardFile = isPlayerWhite ? file : 7 - file;
    const boardRank = isPlayerWhite ? 7 - rank : rank;
    
    const fileChar = String.fromCharCode(97 + boardFile);
    const rankNum = boardRank + 1;
    
    return `${fileChar}${rankNum}`;
  }, [squareSize, isPlayerWhite]);

  // Get relative coordinates within the SVG
  const getRelativeCoordinates = useCallback((e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    // Only handle right-click for mouse, or touch events
    if ('button' in e && e.button !== 2) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getRelativeCoordinates(e);
    const position = coordinatesToPosition(coords.x, coords.y);
    
    if (position) {
      isDraggingRef.current = true;
      setDrawingArrow({ from: position, mouseX: coords.x, mouseY: coords.y });
    }
  }, [disabled, getRelativeCoordinates, coordinatesToPosition]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !drawingArrow) return;
    
    e.preventDefault();
    const coords = getRelativeCoordinates(e);
    
    setDrawingArrow(prev => prev ? { ...prev, mouseX: coords.x, mouseY: coords.y } : null);
  }, [drawingArrow, getRelativeCoordinates]);

  const handleMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !drawingArrow) return;
    
    e.preventDefault();
    const coords = getRelativeCoordinates(e);
    const toPosition = coordinatesToPosition(coords.x, coords.y);
    
    if (toPosition && toPosition !== drawingArrow.from) {
      const newArrow: Arrow = {
        from: drawingArrow.from,
        to: toPosition,
        id: `${drawingArrow.from}-${toPosition}-${Date.now()}`,
      };
      
      setArrows(prev => {
        const updated = [...prev, newArrow];
        onArrowsChange?.(updated);
        return updated;
      });
    }
    
    isDraggingRef.current = false;
    setDrawingArrow(null);
  }, [drawingArrow, getRelativeCoordinates, coordinatesToPosition, onArrowsChange]);

  // Setup global event listeners for dragging
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => handleMouseMove(e);
    const handleUp = (e: MouseEvent | TouchEvent) => handleMouseUp(e);
    
    if (isDraggingRef.current) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  // Clear arrows function (exposed via ref or callback)
  const clearArrows = useCallback(() => {
    setArrows([]);
    onArrowsChange?.([]);
  }, [onArrowsChange]);

  // Expose clearArrows to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__clearChessArrows = clearArrows;
    }
  }, [clearArrows]);

  // Render arrow path with smooth curve
  const renderArrow = (from: string, to: string, id: string) => {
    const fromCoords = positionToCoordinates(from);
    const toCoords = positionToCoordinates(to);
    
    // Calculate control points for a smooth curve
    const dx = toCoords.x - fromCoords.x;
    const dy = toCoords.y - fromCoords.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Shorten the arrow slightly so it doesn't touch the exact center
    const shortenFactor = 0.15;
    const startX = fromCoords.x + dx * shortenFactor;
    const startY = fromCoords.y + dy * shortenFactor;
    const endX = toCoords.x - dx * shortenFactor;
    const endY = toCoords.y - dy * shortenFactor;
    
    // Use a quadratic curve for smoother appearance
    const curveFactor = 0.15;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const controlX = (startX + endX) / 2 + perpX * distance * curveFactor;
    const controlY = (startY + endY) / 2 + perpY * distance * curveFactor;
    
    const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    
    return (
      <motion.g
        key={id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {/* Shadow/outline for better visibility */}
        <path
          d={pathD}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth={squareSize * 0.14}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#arrowhead-shadow)"
        />
        {/* Main arrow */}
        <path
          d={pathD}
          stroke="rgba(255, 170, 0, 0.85)"
          strokeWidth={squareSize * 0.12}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#arrowhead)"
        />
      </motion.g>
    );
  };

  // Render temporary drawing arrow
  const renderDrawingArrow = () => {
    if (!drawingArrow) return null;
    
    const fromCoords = positionToCoordinates(drawingArrow.from);
    const dx = drawingArrow.mouseX - fromCoords.x;
    const dy = drawingArrow.mouseY - fromCoords.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Don't render if too short
    if (distance < squareSize * 0.3) return null;
    
    // Shorten the arrow slightly
    const shortenFactor = 0.15;
    const startX = fromCoords.x + dx * shortenFactor;
    const startY = fromCoords.y + dy * shortenFactor;
    const endX = drawingArrow.mouseX - dx * 0.1;
    const endY = drawingArrow.mouseY - dy * 0.1;
    
    const curveFactor = 0.15;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const controlX = (startX + endX) / 2 + perpX * distance * curveFactor;
    const controlY = (startY + endY) / 2 + perpY * distance * curveFactor;
    
    const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    
    return (
      <g>
        <path
          d={pathD}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth={squareSize * 0.14}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#arrowhead-shadow)"
        />
        <path
          d={pathD}
          stroke="rgba(255, 170, 0, 0.6)"
          strokeWidth={squareSize * 0.12}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#arrowhead-temp)"
        />
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      width={boardSize}
      height={boardSize}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: disabled ? 'none' : 'auto',
        zIndex: 5,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <defs>
        {/* Arrowhead marker - main */}
        <marker
          id="arrowhead"
          markerWidth={squareSize * 0.3}
          markerHeight={squareSize * 0.3}
          refX={squareSize * 0.15}
          refY={squareSize * 0.15}
          orient="auto"
        >
          <polygon
            points={`0,0 ${squareSize * 0.3},${squareSize * 0.15} 0,${squareSize * 0.3}`}
            fill="rgba(255, 170, 0, 0.85)"
          />
        </marker>
        
        {/* Arrowhead marker - shadow */}
        <marker
          id="arrowhead-shadow"
          markerWidth={squareSize * 0.32}
          markerHeight={squareSize * 0.32}
          refX={squareSize * 0.16}
          refY={squareSize * 0.16}
          orient="auto"
        >
          <polygon
            points={`0,0 ${squareSize * 0.32},${squareSize * 0.16} 0,${squareSize * 0.32}`}
            fill="rgba(0, 0, 0, 0.3)"
          />
        </marker>
        
        {/* Arrowhead marker - temporary (while drawing) */}
        <marker
          id="arrowhead-temp"
          markerWidth={squareSize * 0.3}
          markerHeight={squareSize * 0.3}
          refX={squareSize * 0.15}
          refY={squareSize * 0.15}
          orient="auto"
        >
          <polygon
            points={`0,0 ${squareSize * 0.3},${squareSize * 0.15} 0,${squareSize * 0.3}`}
            fill="rgba(255, 170, 0, 0.6)"
          />
        </marker>
      </defs>
      
      <AnimatePresence>
        {arrows.map((arrow) => renderArrow(arrow.from, arrow.to, arrow.id))}
      </AnimatePresence>
      
      {renderDrawingArrow()}
    </svg>
  );
}
