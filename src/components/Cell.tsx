'use client';

import React from 'react';
import { Cell as CellType } from '@/types/game';
import { PLAYER_COLORS } from '@/lib/gameLogic';

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  isCurrentPlayerTurn: boolean;
  currentPlayerId: string;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  cellSize?: number; // New prop for dynamic sizing
}

export function Cell({
  cell,
  row,
  col,
  isCurrentPlayerTurn,
  currentPlayerId,
  onCellClick,
  disabled = false,
  cellSize = 60, // Default fallback size
}: CellProps) {
  const canClick = !disabled && isCurrentPlayerTurn && (!cell.ownerId || cell.ownerId === currentPlayerId);
  
  // Get player color index based on ownerId
  const getPlayerColorIndex = (ownerId: string | undefined): number => {
    if (!ownerId) return 0;
    // Simple hash to get consistent color index for player ID
    let hash = 0;
    for (let i = 0; i < ownerId.length; i++) {
      hash = ((hash << 5) - hash + ownerId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % PLAYER_COLORS.length;
  };

  const playerColorIndex = getPlayerColorIndex(cell.ownerId);
  const playerColor = PLAYER_COLORS[playerColorIndex];

  const handleClick = () => {
    if (canClick) {
      onCellClick(row, col);
    }
  };

  // Determine if cell is near critical mass for visual warning
  const isNearCritical = cell.orbs === cell.criticalMass - 1;
  const isCritical = cell.orbs >= cell.criticalMass;

  // Calculate orb sizes relative to cell size
  const calculateOrbSizes = () => {
    // Base orb size as percentage of cell size
    const baseOrbRatio = 0.15; // 15% of cell size for individual orbs
    const largeOrbRatio = 0.2;  // 20% of cell size for count display orb
    
    const individualOrbSize = Math.max(6, Math.floor(cellSize * baseOrbRatio)); // Min 6px
    const countOrbSize = Math.max(8, Math.floor(cellSize * largeOrbRatio));      // Min 8px
    const fontSize = Math.max(10, Math.floor(cellSize * 0.25));                  // Min 10px for text
    const criticalFontSize = Math.max(8, Math.floor(cellSize * 0.2));           // Min 8px for critical mass
    
    return {
      individual: individualOrbSize,
      count: countOrbSize,
      fontSize,
      criticalFontSize
    };
  };
  
  const orbSizes = calculateOrbSizes();

  return (
    <button
      onClick={handleClick}
      disabled={!canClick}
      className={`
        relative aspect-square
        border-2 border-gray-300 dark:border-gray-600
        transition-all duration-200 ease-in-out
        ${
          canClick
            ? 'hover:border-blue-400 hover:shadow-md cursor-pointer'
            : 'cursor-not-allowed opacity-75'
        }
        ${
          isCritical
            ? 'animate-pulse border-red-500 bg-red-50 dark:bg-red-900/20'
            : isNearCritical
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
            : 'bg-white dark:bg-gray-800'
        }
        rounded-lg shadow-sm
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        borderColor: cell.ownerId ? playerColor : undefined,
        backgroundColor: cell.ownerId ? `${playerColor}15` : undefined,
      }}
      aria-label={`Cell at row ${row + 1}, column ${col + 1}. ${cell.orbs} orbs. ${
        cell.ownerId ? `Owned by player` : 'Empty'
      }. Critical mass: ${cell.criticalMass}`}
    >
      {/* Orb display */}
      {cell.orbs > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 p-1">
          {/* For 1-4 orbs, show individual orbs */}
          {cell.orbs <= 4 ? (
            Array.from({ length: cell.orbs }).map((_, index) => (
              <div
                key={index}
                className="rounded-full shadow-sm"
                style={{ 
                  backgroundColor: playerColor,
                  width: `${orbSizes.individual}px`,
                  height: `${orbSizes.individual}px`
                }}
              />
            ))
          ) : (
            /* For more than 4 orbs, show count */
            <div className="flex flex-col items-center">
              <div
                className="rounded-full shadow-sm"
                style={{ 
                  backgroundColor: playerColor,
                  width: `${orbSizes.count}px`,
                  height: `${orbSizes.count}px`
                }}
              />
              <span
                className="font-bold mt-1"
                style={{ 
                  color: playerColor,
                  fontSize: `${orbSizes.fontSize}px`
                }}
              >
                {cell.orbs}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Critical mass indicator */}
      {cell.orbs === 0 && (
        <div 
          className="text-gray-400 dark:text-gray-500 font-mono"
          style={{ fontSize: `${orbSizes.criticalFontSize}px` }}
        >
          {cell.criticalMass}
        </div>
      )}

      {/* Visual feedback for clickable state */}
      {canClick && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-blue-400 transition-colors duration-200" />
      )}
    </button>
  );
}