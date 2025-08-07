'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, useTransition, animated, config } from '@react-spring/web';
import { Cell as CellType, Player } from '@/types/game';

interface AnimatedCellProps {
  cell: CellType;
  row: number;
  col: number;
  players: Player[];
  isCurrentPlayerTurn: boolean;
  currentPlayerId: string;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  isAnimating?: boolean;
  shouldPulse?: boolean;
  isExploding?: boolean;
  cellSize?: number; // New prop for dynamic sizing
}

// Orb position configurations for different counts
const ORB_POSITIONS = [
  [], // 0 orbs
  [{ x: 50, y: 50 }], // 1 orb - center
  [
    { x: 35, y: 35 },
    { x: 65, y: 65 },
  ], // 2 orbs - diagonal
  [
    { x: 50, y: 25 },
    { x: 30, y: 60 },
    { x: 70, y: 60 },
  ], // 3 orbs - triangle
  [
    { x: 30, y: 30 },
    { x: 70, y: 30 },
    { x: 30, y: 70 },
    { x: 70, y: 70 },
  ], // 4+ orbs - square
];

export function AnimatedCell({
  cell,
  row,
  col,
  players,
  isCurrentPlayerTurn,
  currentPlayerId,
  onCellClick,
  disabled = false,
  isAnimating = false,
  shouldPulse = false,
  isExploding = false,
  cellSize = 60, // Default fallback size
}: AnimatedCellProps) {
  const canClick = !disabled && !isAnimating && isCurrentPlayerTurn && (!cell.ownerId || cell.ownerId === currentPlayerId);
  const [localExploding, setLocalExploding] = useState(false);
  
  // Get the actual player color from the players array
  const getPlayerColor = (ownerId: string | undefined): string => {
    if (!ownerId) return '#999999';
    const player = players.find(p => p.id === ownerId);
    return player?.color || '#999999';
  };

  const playerColor = getPlayerColor(cell.ownerId);

  // Calculate orb sizes relative to cell size
  const calculateOrbSizes = () => {
    const orbRatio = 0.3; // 30% of cell size for animated orbs (bigger than static ones)
    const fontSize = Math.max(12, Math.floor(cellSize * 0.35)); // 35% for text
    const criticalFontSize = Math.max(8, Math.floor(cellSize * 0.15)); // 15% for critical indicator
    
    const orbSize = Math.max(12, Math.floor(cellSize * orbRatio)); // Min 12px for animations
    
    return {
      orb: orbSize,
      fontSize,
      criticalFontSize
    };
  };
  
  const orbSizes = calculateOrbSizes();

  // Cell spring for hover effects
  const [cellSpring, cellApi] = useSpring(() => ({
    scale: 1,
    borderColor: '#374151',
    config: config.gentle,
  }));

  // Explosion spring for background effect
  const [explosionSpring, explosionApi] = useSpring(() => ({
    scale: 0,
    opacity: 0,
    config: config.gentle,
  }));

  // Handle explosion animation
  useEffect(() => {
    if (isExploding || (cell.orbs >= cell.criticalMass && localExploding)) {
      (async () => {
        // Explosion effect
        await explosionApi.start({ 
          scale: 1.5, 
          opacity: 0.6,
          config: { tension: 300, friction: 10 } 
        });
        await explosionApi.start({ 
          scale: 2, 
          opacity: 0,
          config: { tension: 280, friction: 20 } 
        });
        setLocalExploding(false);
      })();
    } else {
      explosionApi.start({ scale: 0, opacity: 0 });
    }
  }, [isExploding, localExploding, cell.orbs, cell.criticalMass, explosionApi]);

  // Detect when cell reaches critical mass
  useEffect(() => {
    if (cell.orbs >= cell.criticalMass && cell.orbs > 0) {
      setLocalExploding(true);
    }
  }, [cell.orbs, cell.criticalMass]);

  // Hover effects
  const handleMouseEnter = () => {
    if (canClick) {
      cellApi.start({
        scale: 1.05,
        borderColor: playerColor || currentPlayerId ? getPlayerColor(currentPlayerId) : '#374151',
      });
    }
  };

  const handleMouseLeave = () => {
    cellApi.start({
      scale: 1,
      borderColor: '#374151',
    });
  };

  const handleClick = () => {
    if (canClick) {
      onCellClick(row, col);
    }
  };

  // Orb transitions with smooth entrance/exit
  const orbPositions = ORB_POSITIONS[Math.min(cell.orbs, ORB_POSITIONS.length - 1)];
  const orbTransitions = useTransition(
    cell.orbs > 0 ? orbPositions.slice(0, Math.min(cell.orbs, 4)).map((pos, i) => ({ ...pos, key: i })) : [],
    {
      keys: (item) => item.key,
      from: { scale: 0, opacity: 0 },
      enter: { scale: 1, opacity: 1 },
      leave: { scale: 0, opacity: 0 },
      config: config.wobbly,
    }
  );

  // Determine if cell is near critical mass for visual warning
  const isNearCritical = cell.orbs === cell.criticalMass - 1;
  const isCritical = cell.orbs >= cell.criticalMass;

  return (
    <animated.button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={!canClick}
      className="relative block w-full h-full rounded-lg transition-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden p-0 m-0 bg-gray-900/50 dark:bg-gray-800/50"
      style={{
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: cellSpring.borderColor,
        cursor: canClick ? 'pointer' : 'not-allowed',
        opacity: canClick ? 1 : 0.7,
        boxShadow: isNearCritical ? `0 0 20px ${playerColor}40` : 'none',
        transform: cellSpring.scale.to(s => `scale(${s})`),
        transformOrigin: 'center center',
      }}
      aria-label={`Cell at row ${row + 1}, column ${col + 1}. ${cell.orbs} orbs. ${
        cell.ownerId ? `Owned by player` : 'Empty'
      }. Critical mass: ${cell.criticalMass}`}
    >
      {/* Explosion effect overlay */}
      <animated.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: playerColor,
          transform: explosionSpring.scale.to(s => `scale(${s})`),
          opacity: explosionSpring.opacity,
          transformOrigin: 'center center',
        }}
      />
      {/* Near-critical indicator - pulsing dot */}
      {isNearCritical && !isCritical && (
        <div
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
          style={{
            animation: 'pulse 0.8s infinite ease-in-out',
          }}
        />
      )}

      {/* Orbs with smooth transitions */}
      <div className="absolute inset-0 pointer-events-none">
        {orbTransitions((style, item) => 
          item && (
            <animated.div
              key={item.key}
              className="absolute rounded-full"
              style={{
                width: orbSizes.orb,
                height: orbSizes.orb,
                background: playerColor,
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: style.scale.to(s => `translate(-50%, -50%) scale(${s})`),
                opacity: style.opacity,
                boxShadow: `0 0 15px ${playerColor}80`,
                filter: 'brightness(1.2)',
              }}
            />
          )
        )}
        
        {/* Show count for 5+ orbs */}
        {cell.orbs > 4 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold"
              style={{
                color: playerColor,
                fontSize: `${orbSizes.fontSize}px`,
                textShadow: `0 0 10px ${playerColor}60`,
              }}
            >
              {cell.orbs}
            </span>
          </div>
        )}
      </div>

      {/* Critical mass indicator */}
      <div 
        className="absolute bottom-1 right-1 text-gray-500 dark:text-gray-400 font-mono opacity-60 pointer-events-none"
        style={{ fontSize: `${orbSizes.criticalFontSize}px` }}
      >
        {cell.orbs}/{cell.criticalMass}
      </div>

      {/* Pulse animation styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.6;
          }
        }
      `}</style>
    </animated.button>
  );
}