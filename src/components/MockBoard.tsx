'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatedCell } from './AnimatedCell';
import { AnimationLayer } from './AnimationLayer';
import {
  OrbAnimation,
  ExplosionAnimation,
  PlacementAnimation
} from '@/lib/animationUtils';

import { Cell, Player } from '@/types/game';

// Game state interfaces - updated to match GameBoard patterns
interface MockCell {
  orbs: number;
  ownerId?: string;
  criticalMass: number;
}

interface MockPlayer {
  id: string;
  name: string;
  color: string;
  orbCount: number;
  isEliminated: boolean;
  isConnected: boolean;
}

// New interface to match GameBoard's lastMove pattern
interface MockMove {
  row: number;
  col: number;
  playerId: string;
}

interface MockBoardProps {
  className?: string;
  interactive?: boolean;
  initialSetup?: 'empty' | 'demo' | 'infection' | 'slide1' | 'slide2' | 'slide3' | 'slide4' | 'slide5';
  currentPlayer?: string;
  players?: MockPlayer[];
  onMove?: (row: number, col: number) => void;
  onCurrentPlayerChange?: (playerId: string, playerColor: string) => void;
}

// Helper function to calculate critical mass based on position
function getCriticalMass(row: number, col: number, totalRows: number, totalCols: number): number {
  const isCorner = (row === 0 || row === totalRows - 1) && (col === 0 || col === totalCols - 1);
  const isEdge = row === 0 || row === totalRows - 1 || col === 0 || col === totalCols - 1;

  if (isCorner) return 2;
  if (isEdge) return 3;
  return 4;
}

// Stable empty arrays defined outside component to prevent re-renders
const EMPTY_EXPLOSIONS: ExplosionAnimation[] = [];
const EMPTY_ORBS: OrbAnimation[] = [];

export function MockBoard({
  className = "",
  interactive = false,
  initialSetup = 'empty',
  currentPlayer,
  players,
  onMove,
  onCurrentPlayerChange
}: MockBoardProps) {
  // Default players and state setup
  const defaultPlayers: MockPlayer[] = [
    { id: 'player1', name: 'Player 1', color: '#3B82F6', orbCount: 0, isEliminated: false, isConnected: true },
    { id: 'player2', name: 'Player 2', color: '#EF4444', orbCount: 0, isEliminated: false, isConnected: true },
  ];

  const gamePlayers = players || defaultPlayers;
  const [currentPlayerId, setCurrentPlayerId] = useState(currentPlayer || gamePlayers[0].id);

  const rows = 5;
  const cols = 5;
  
  function createInitialGrid(setup: string): MockCell[][] {
    const newGrid = Array(rows).fill(null).map((_, row) =>
      Array(cols).fill(null).map((_, col) => ({
        orbs: 0,
        criticalMass: getCriticalMass(row, col, rows, cols),
      }))
    );

    // Enhanced tutorial slide setups for 5x5 grid - designed for maximum educational impact
    switch (setup) {
      case 'slide1': 
        // Two-player interactive sandbox with strategic orb placement
        // Shows basic placement mechanics with some existing orbs to demonstrate ownership
        newGrid[1][1] = { ...newGrid[1][1], orbs: 1, ownerId: 'player1' }; // Blue orb in upper-left area
        newGrid[3][3] = { ...newGrid[3][3], orbs: 1, ownerId: 'player2' }; // Red orb in lower-right area
        newGrid[2][2] = { ...newGrid[2][2], orbs: 1, ownerId: 'player1' }; // Blue orb in center
        break;
      case 'slide2': 
        // Critical mass cell for explosion demonstration - center cell ready to explode
        newGrid[2][2] = { ...newGrid[2][2], orbs: 3, ownerId: 'player1' }; // Center cell at critical mass (4-1=3)
        break;
      case 'slide3':
        // Show corner, edge, and center cells with different critical masses - all at critical-1
        newGrid[0][0] = { ...newGrid[0][0], orbs: 1, ownerId: 'player1' }; // Corner (critical mass 2, showing 1)
        newGrid[0][2] = { ...newGrid[0][2], orbs: 2, ownerId: 'player1' }; // Edge (critical mass 3, showing 2)
        newGrid[2][2] = { ...newGrid[2][2], orbs: 3, ownerId: 'player1' }; // Center (critical mass 4, showing 3)
        break;
      case 'slide4':
        // Infection scenario with blue trigger and red target cells
        // Blue cell ready to explode and infect surrounding red cells
        newGrid[2][2] = { ...newGrid[2][2], orbs: 3, ownerId: 'player1' }; // Blue trigger cell (ready to explode)
        newGrid[1][2] = { ...newGrid[1][2], orbs: 1, ownerId: 'player2' }; // Red target above
        newGrid[3][2] = { ...newGrid[3][2], orbs: 1, ownerId: 'player2' }; // Red target below
        newGrid[2][1] = { ...newGrid[2][1], orbs: 1, ownerId: 'player2' }; // Red target left
        newGrid[2][3] = { ...newGrid[2][3], orbs: 1, ownerId: 'player2' }; // Red target right
        break;
      case 'slide5':
        // Complex chain reaction with multiple waves of explosions
        // Designed to create a spectacular multi-wave chain reaction
        newGrid[2][2] = { ...newGrid[2][2], orbs: 3, ownerId: 'player1' }; // Center trigger (wave 1)
        newGrid[1][2] = { ...newGrid[1][2], orbs: 3, ownerId: 'player2' }; // Above center (will become critical in wave 1)
        newGrid[3][2] = { ...newGrid[3][2], orbs: 3, ownerId: 'player2' }; // Below center (will become critical in wave 1)
        newGrid[2][1] = { ...newGrid[2][1], orbs: 3, ownerId: 'player2' }; // Left of center (will become critical in wave 1)
        newGrid[2][3] = { ...newGrid[2][3], orbs: 3, ownerId: 'player2' }; // Right of center (will become critical in wave 1)
        // Secondary chain cells that will explode in wave 2
        newGrid[0][2] = { ...newGrid[0][2], orbs: 2, ownerId: 'player2' }; // Top edge (will explode in wave 2)
        newGrid[4][2] = { ...newGrid[4][2], orbs: 2, ownerId: 'player2' }; // Bottom edge (will explode in wave 2)
        newGrid[2][0] = { ...newGrid[2][0], orbs: 2, ownerId: 'player2' }; // Left edge (will explode in wave 2)
        newGrid[2][4] = { ...newGrid[2][4], orbs: 2, ownerId: 'player2' }; // Right edge (will explode in wave 2)
        break;
    }
    return newGrid;
  }

  // NEW: Separate logical and display grids (matching GameBoard pattern)
  const [logicalGrid, setLogicalGrid] = useState<MockCell[][]>(() => createInitialGrid(initialSetup));
  const [displayGrid, setDisplayGrid] = useState<MockCell[][]>(() => createInitialGrid(initialSetup));
  
  // NEW: lastMove state to trigger animations (matching GameBoard pattern)
  const [lastMove, setLastMove] = useState<MockMove | null>(null);
  
  // NEW: Ref to prevent duplicate animation processing (matching GameBoard pattern)
  const lastProcessedMove = useRef<{ row: number; col: number; playerId: string } | null>(null);
  
  // Ref to track previous player to prevent unnecessary callback calls
  const previousPlayerIdRef = useRef<string | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [explodingCells, setExplodingCells] = useState<Set<string>>(new Set());
  const [currentAnimations, setCurrentAnimations] = useState<{
    placement?: PlacementAnimation;
    explosions: ExplosionAnimation[];
    orbs: OrbAnimation[];
  }>({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });

  // State for managing wave-by-wave animations
  const [waveIndex, setWaveIndex] = useState(-1); // -1: inactive, 0+: a wave is running
  const waveDataRef = useRef<{
    waves: Array<{ explodingCells: any[]; gridState: MockCell[][] }>;
    finalGrid: MockCell[][];
    playerColor: string;
  } | null>(null);

  useEffect(() => {
    const newGrid = createInitialGrid(initialSetup);
    setLogicalGrid(newGrid);
    setDisplayGrid(newGrid);
    setLastMove(null);
    lastProcessedMove.current = null;
    setIsAnimating(false);
    setExplodingCells(new Set());
    setCurrentAnimations({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
    setWaveIndex(-1); // Reset wave machine on setup change
  }, [initialSetup]);
  
  // Sizing logic optimized for 5x5 grid
  const calculateBoardDimensions = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const reservedWidth = 64;
    const availableWidth = viewportWidth - reservedWidth;
    const maxBoardWidth = availableWidth * 0.9;
    const gap = viewportWidth < 640 ? 4 : 6;
    let cellSize = (maxBoardWidth - (gap * (cols - 1))) / cols;
    
    // Adjusted max cell size for 5x5 grid to ensure good fit on all devices
    const maxAllowed = viewportWidth < 640 ? 60 : viewportWidth < 1024 ? 70 : 80;
    cellSize = Math.min(cellSize, maxAllowed);
    cellSize = Math.max(cellSize, 30);
    
    const boardWidth = (cellSize * cols) + (gap * (cols - 1));
    const boardHeight = (cellSize * rows) + (gap * (rows - 1));
    return { cellSize: Math.floor(cellSize), gap, boardWidth: Math.floor(boardWidth), boardHeight: Math.floor(boardHeight) };
  };
  const { cellSize, gap, boardWidth, boardHeight } = calculateBoardDimensions();

  function getAdjacentCells(row: number, col: number): Array<{ row: number; col: number }> {
    const adjacent = [];
    if (row > 0) adjacent.push({ row: row - 1, col });
    if (row < rows - 1) adjacent.push({ row: row + 1, col });
    if (col > 0) adjacent.push({ row, col: col - 1 });
    if (col < cols - 1) adjacent.push({ row, col: col + 1 });
    return adjacent;
  }

  function simulateExplosionsWithWaves(initialGrid: MockCell[][], playerId: string) {
    let gridForCurrentWave = initialGrid.map(row => row.map(cell => ({ ...cell })));
    const explosionWaves = [];
    const maxWaves = 100; // Increased limit to handle very long chain reactions
    let wave = 0;

    while (wave < maxWaves) {
      const unstableCells: Array<{ row: number; col: number }> = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (gridForCurrentWave[r][c].orbs >= gridForCurrentWave[r][c].criticalMass) unstableCells.push({ row: r, col: c });
      if (unstableCells.length === 0) break;

      explosionWaves.push({ explodingCells: [...unstableCells], gridState: gridForCurrentWave.map(row => row.map(cell => ({ ...cell }))) });
      const gridForNextWave = gridForCurrentWave.map(row => row.map(cell => ({ ...cell })));

      unstableCells.forEach(({ row, col }) => {
        gridForNextWave[row][col].orbs -= gridForCurrentWave[row][col].criticalMass;
        const neighbors = getAdjacentCells(row, col);
        neighbors.forEach(adj => {
          gridForNextWave[adj.row][adj.col].orbs += 1;
          gridForNextWave[adj.row][adj.col].ownerId = playerId;
        });
      });
      unstableCells.forEach(({ row, col }) => { if (gridForNextWave[row][col].orbs <= 0) gridForNextWave[row][col].ownerId = undefined; });
      gridForCurrentWave = gridForNextWave;
      wave++;
    }
    
    // Safety check: ensure no cells exceed critical mass in final grid
    if (wave >= maxWaves) {
      console.warn(`Hit maximum wave limit of ${maxWaves}. Chain reaction may be incomplete.`);
    }
    
    return { finalGrid: gridForCurrentWave, explosionWaves };
  }
  
  // Store refs for player switching to avoid dependency issues
  const gamePlayersRef = useRef(gamePlayers);
  const currentPlayerIdRef = useRef(currentPlayerId);
  
  useEffect(() => {
    gamePlayersRef.current = gamePlayers;
  }, [gamePlayers]);
  
  useEffect(() => {
    currentPlayerIdRef.current = currentPlayerId;
  }, [currentPlayerId]);

  // Separate effect for notifying parent of player changes (only when currentPlayerId actually changes)
  useEffect(() => {
    if (onCurrentPlayerChange && previousPlayerIdRef.current !== currentPlayerId) {
      const currentPlayerData = gamePlayers.find(p => p.id === currentPlayerId);
      if (currentPlayerData) {
        onCurrentPlayerChange(currentPlayerId, currentPlayerData.color);
        previousPlayerIdRef.current = currentPlayerId;
      }
    }
  }, [currentPlayerId]); // Only depend on currentPlayerId, not the callback or gamePlayers

  // This effect hook drives the wave-by-wave animation
  useEffect(() => {
    if (waveIndex < 0 || !waveDataRef.current) return;

    const { waves, finalGrid, playerColor } = waveDataRef.current;

    // Check if all waves are completed
    if (waveIndex >= waves.length) {
      setLogicalGrid(finalGrid);
      setDisplayGrid(finalGrid);
      setCurrentAnimations({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
      setExplodingCells(new Set());
      setIsAnimating(false);
      setWaveIndex(-1);
      waveDataRef.current = null;
      
      // Use refs to avoid dependency issues
      const nextIndex = (gamePlayersRef.current.findIndex(p => p.id === currentPlayerIdRef.current) + 1) % gamePlayersRef.current.length;
      setCurrentPlayerId(gamePlayersRef.current[nextIndex].id);
      return;
    }

    // Process the current wave
    const wave = waves[waveIndex];
    setDisplayGrid(wave.gridState);

    const explosionAnims: ExplosionAnimation[] = [];
    const orbAnims: OrbAnimation[] = [];

    wave.explodingCells.forEach(({ row: fromRow, col: fromCol }: { row: number; col: number }) => {
      // FIX: Use stable ID with waveIndex instead of Date.now()
      explosionAnims.push({ 
        id: `exp-${waveIndex}-${fromRow}-${fromCol}`,
        row: fromRow, 
        col: fromCol, 
        color: playerColor, 
        delay: 0, 
        wave: waveIndex
      });
      
      const neighbors = getAdjacentCells(fromRow, fromCol);
      neighbors.forEach(({ row: toRow, col: toCol }) => {
        // FIX: Use stable ID with waveIndex instead of Date.now()
        orbAnims.push({ 
          id: `orb-${waveIndex}-${fromRow},${fromCol}-to-${toRow},${toCol}`,
          fromRow, 
          fromCol, 
          toRow, 
          toCol, 
          color: playerColor, 
          delay: 50, 
          wave: waveIndex
        });
      });
    });
    
    setCurrentAnimations({ explosions: explosionAnims, orbs: orbAnims });
    setExplodingCells(new Set(wave.explodingCells.map((c: any) => `${c.row}-${c.col}`)));

  }, [waveIndex]); // Only depend on waveIndex!

  // NEW: Main animation useEffect hook that watches lastMove state changes (matching GameBoard pattern)
  useEffect(() => {
    // Skip if no move info or if we already processed this move
    if (!lastMove ||
      (lastProcessedMove.current &&
        lastProcessedMove.current.row === lastMove.row &&
        lastProcessedMove.current.col === lastMove.col &&
        lastProcessedMove.current.playerId === lastMove.playerId)) {
      return;
    }

    // Skip if currently animating
    if (isAnimating && waveIndex >= 0) {
      return;
    }

    const { row, col, playerId } = lastMove;

    // Mark this move as processed
    lastProcessedMove.current = { row, col, playerId };

    // Get the player who made the move
    const player = gamePlayers.find(p => p.id === playerId);
    if (!player) {
      setIsAnimating(false);
      return;
    }

    const playerColor = player.color;

    // Get the grid before the move (from display state)
    const gridBeforeMove = displayGrid.map(r => r.map(c => ({ ...c })));

    // Simulate placing the orb
    const gridAfterPlacement = gridBeforeMove.map(r => r.map(c => ({ ...c })));
    gridAfterPlacement[row][col] = {
      ...gridBeforeMove[row][col],
      orbs: gridBeforeMove[row][col].orbs + 1,
      ownerId: playerId
    };

    // Check if this placement causes explosions
    if (gridAfterPlacement[row][col].orbs < gridAfterPlacement[row][col].criticalMass) {
      // Simple placement, no explosions
      setDisplayGrid(gridAfterPlacement);
      
      setTimeout(() => {
        setIsAnimating(false);
        // Switch to next player
        const nextIndex = (gamePlayers.findIndex(p => p.id === currentPlayerId) + 1) % gamePlayers.length;
        setCurrentPlayerId(gamePlayers[nextIndex].id);
      }, 200);
      return;
    }

    // Explosions will happen - simulate them
    const { finalGrid, explosionWaves } = simulateExplosionsWithWaves(gridAfterPlacement, playerId);

    if (explosionWaves.length === 0) {
      // No explosions after all
      setDisplayGrid(gridAfterPlacement);
      setIsAnimating(false);
      const nextIndex = (gamePlayers.findIndex(p => p.id === currentPlayerId) + 1) % gamePlayers.length;
      setCurrentPlayerId(gamePlayers[nextIndex].id);
      return;
    }

    // Show placement first
    setDisplayGrid(gridAfterPlacement);

    // After placement animation, start explosion waves
    setTimeout(() => {
      // Perform the "disappearance" step for the first wave
      if (explosionWaves.length > 0) {
        const gridBeforeExplosion = gridAfterPlacement.map(r => r.map(c => ({ ...c })));
        const firstWaveCells = explosionWaves[0].explodingCells;
        firstWaveCells.forEach(({ row: r, col: c }: { row: number; col: number }) => {
          gridBeforeExplosion[r][c].orbs -= gridBeforeExplosion[r][c].criticalMass;
          if (gridBeforeExplosion[r][c].orbs <= 0) {
            gridBeforeExplosion[r][c].ownerId = undefined;
          }
        });
        setDisplayGrid(gridBeforeExplosion);
      }

      // Start wave animations after disappearance
      setTimeout(() => {
        waveDataRef.current = {
          waves: explosionWaves,
          finalGrid,
          playerColor
        };
        setWaveIndex(0);
      }, 100);
    }, 200);
  }, [lastMove, isAnimating, waveIndex, displayGrid, gamePlayers, currentPlayerId]);

  // Refactored handleCellClick to use state-driven pattern (Task 4)
  const handleCellClick = (row: number, col: number) => {
    // Basic validation - return early if conditions not met
    if (!interactive || isAnimating) return;
    
    const cell = logicalGrid[row][col];
    
    // Validate move - can only place in empty cells or cells you own
    if (cell.ownerId && cell.ownerId !== currentPlayerId) return;

    // Immediately set animating to prevent further clicks
    setIsAnimating(true);
    
    // Update logical grid with the new orb placement
    const newLogicalGrid = logicalGrid.map(r => r.map(c => ({ ...c })));
    newLogicalGrid[row][col] = { 
      ...cell, 
      orbs: cell.orbs + 1, 
      ownerId: currentPlayerId 
    };
    setLogicalGrid(newLogicalGrid);
    
    // Set lastMove state to trigger animation useEffect
    setLastMove({ row, col, playerId: currentPlayerId });
    
    // Call optional callback
    if (onMove) onMove(row, col);
  };
  

  const handleAnimationComplete = () => {
    if (waveIndex >= 0) {
      setWaveIndex(prevIndex => prevIndex + 1);
    }
  };

  // Get current player for color indicator
  const currentPlayerObj = gamePlayers.find(p => p.id === currentPlayerId);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className="relative bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700">
          {/* Current player color indicator - similar to GameBoard */}
          {interactive && currentPlayerObj && (
            <div
              className="absolute -top-0.5 left-6 right-6 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${currentPlayerObj.color}, transparent)`,
                animation: 'glow 2s ease-in-out infinite',
              }}
            />
          )}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gap: `${gap}px`,
              width: `${boardWidth}px`,
              height: `${boardHeight}px`,
            }}
          >
            {displayGrid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <AnimatedCell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  players={gamePlayers}
                  isCurrentPlayerTurn={interactive}
                  currentPlayerId={currentPlayerId}
                  onCellClick={handleCellClick}
                  disabled={!interactive || isAnimating}
                  isAnimating={isAnimating}
                  shouldPulse={cell.orbs >= cell.criticalMass && !isAnimating}
                  isExploding={explodingCells.has(`${rowIndex}-${colIndex}`)}
                  cellSize={cellSize}
                />
              ))
            )}
            <AnimationLayer
              placementAnimation={currentAnimations.placement}
              explosionAnimations={currentAnimations.explosions}
              orbAnimations={currentAnimations.orbs}
              cellSize={cellSize}
              gap={gap}
              onAnimationComplete={handleAnimationComplete}
            />
          </div>
          <div className="absolute bottom-2 left-3 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
            {rows}×{cols}
          </div>
        </div>
      </div>

      {/* Glow animation for turn indicator */}
      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            opacity: 0.6;
            transform: scaleY(0.8);
          }
          50% {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}