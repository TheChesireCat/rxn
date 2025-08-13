'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { AnimatedCell } from './AnimatedCell';
import { AnimationLayer } from './AnimationLayer';
import {
  OrbAnimation,
  ExplosionAnimation,
  PlacementAnimation
} from '@/lib/animationUtils';

// Game state interfaces
interface MockCell {
  orbs: number;
  ownerId?: string;
  criticalMass: number;
}

interface MockPlayer {
  id: string;
  name:string;
  color: string;
  isEliminated?: boolean;
}

interface MockBoardProps {
  className?: string;
  interactive?: boolean;
  initialSetup?: 'empty' | 'demo' | 'infection' | 'slide1' | 'slide2' | 'slide3' | 'slide4' | 'slide5';
  currentPlayer?: string;
  players?: MockPlayer[];
  onMove?: (row: number, col: number) => void;
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
  onMove
}: MockBoardProps) {
  // Default players and state setup
  const defaultPlayers: MockPlayer[] = [
    { id: 'player1', name: 'Player 1', color: '#3B82F6', isEliminated: false },
    { id: 'player2', name: 'Player 2', color: '#EF4444', isEliminated: false },
  ];

  const gamePlayers = players || defaultPlayers;
  const [currentPlayerId, setCurrentPlayerId] = useState(currentPlayer || gamePlayers[0].id);

  const rows = 3;
  const cols = 3;
  
  function createInitialGrid(setup: string): MockCell[][] {
    const newGrid = Array(rows).fill(null).map((_, row) =>
      Array(cols).fill(null).map((_, col) => ({
        orbs: 0,
        ownerId: undefined,
        criticalMass: getCriticalMass(row, col, rows, cols),
      }))
    );

    // Initial board setups
    switch (setup) {
      case 'slide1': newGrid[1][1] = { orbs: 1, ownerId: 'player1', criticalMass: 4 }; break;
      case 'slide2': newGrid[1][1] = { orbs: 3, ownerId: 'player1', criticalMass: 4 }; break;
      case 'slide3':
        newGrid[0][0] = { orbs: 1, ownerId: 'player1', criticalMass: 2 };
        newGrid[0][1] = { orbs: 2, ownerId: 'player1', criticalMass: 3 };
        newGrid[1][1] = { orbs: 3, ownerId: 'player1', criticalMass: 4 };
        break;
      case 'slide4':
        newGrid[1][1] = { orbs: 3, ownerId: 'player1', criticalMass: 4 };
        newGrid[0][1] = { orbs: 1, ownerId: 'player2', criticalMass: 3 };
        break;
      case 'slide5':
        newGrid[1][1] = { orbs: 3, ownerId: 'player1', criticalMass: 4 };
        newGrid[0][1] = { orbs: 2, ownerId: 'player2', criticalMass: 3 };
        newGrid[1][0] = { orbs: 1, ownerId: 'player2', criticalMass: 3 };
        break;
    }
    return newGrid;
  }

  const [grid, setGrid] = useState<MockCell[][]>(() => createInitialGrid(initialSetup));
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
    setGrid(createInitialGrid(initialSetup));
    setIsAnimating(false);
    setExplodingCells(new Set());
    setCurrentAnimations({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
    setWaveIndex(-1); // Reset wave machine on setup change
  }, [initialSetup]);
  
  // Sizing logic
  const calculateBoardDimensions = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const reservedWidth = 64;
    const availableWidth = viewportWidth - reservedWidth;
    const maxBoardWidth = availableWidth * 0.9;
    const gap = viewportWidth < 640 ? 4 : 6;
    let cellSize = (maxBoardWidth - (gap * (cols - 1))) / cols;
    const maxAllowed = cols <= 6 ? 80 : cols <= 8 ? 70 : 60;
    cellSize = Math.min(cellSize, maxAllowed, 60);
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

  // This effect hook drives the wave-by-wave animation
  useEffect(() => {
    if (waveIndex < 0 || !waveDataRef.current) return;

    const { waves, finalGrid, playerColor } = waveDataRef.current;

    // Check if all waves are completed
    if (waveIndex >= waves.length) {
      setGrid(finalGrid);
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
    setGrid(wave.gridState);

    const explosionAnims: ExplosionAnimation[] = [];
    const orbAnims: OrbAnimation[] = [];

    wave.explodingCells.forEach(({ row: fromRow, col: fromCol }: { row: number; col: number }) => {
      // FIX: Use stable ID with waveIndex instead of Date.now()
      explosionAnims.push({ 
        row: fromRow, 
        col: fromCol, 
        color: playerColor, 
        delay: 0, 
        wave: waveIndex,
        id: `exp-${waveIndex}-${fromRow}-${fromCol}` 
      });
      
      const neighbors = getAdjacentCells(fromRow, fromCol);
      neighbors.forEach(({ row: toRow, col: toCol }) => {
        // FIX: Use stable ID with waveIndex instead of Date.now()
        orbAnims.push({ 
          fromRow, 
          fromCol, 
          toRow, 
          toCol, 
          color: playerColor, 
          delay: 50, 
          wave: waveIndex,
          id: `orb-${waveIndex}-${fromRow},${fromCol}-to-${toRow},${toCol}` 
        });
      });
    });
    
    setCurrentAnimations({ explosions: explosionAnims, orbs: orbAnims });
    setExplodingCells(new Set(wave.explodingCells.map((c: any) => `${c.row}-${c.col}`)));

  }, [waveIndex]); // Only depend on waveIndex!

  // handleCellClick now kicks off the wave machine
  const handleCellClick = async (row: number, col: number) => {
    if (!interactive || isAnimating) return;
    const cell = grid[row][col];
    if (cell.ownerId && cell.ownerId !== currentPlayerId) return;

    setIsAnimating(true);

    const player = gamePlayers.find(p => p.id === currentPlayerId);
    const playerColor = player?.color || '#888888';

    // 1. Perform placement
    const gridAfterPlacement = grid.map(r => r.map(c => ({ ...c })));
    gridAfterPlacement[row][col] = { ...cell, orbs: cell.orbs + 1, ownerId: currentPlayerId };
    setGrid(gridAfterPlacement);
    await new Promise(res => setTimeout(res, 200));

    // 2. Check for explosions
    if (gridAfterPlacement[row][col].orbs < gridAfterPlacement[row][col].criticalMass) {
      setIsAnimating(false);
      const nextIndex = (gamePlayers.findIndex(p => p.id === currentPlayerId) + 1) % gamePlayers.length;
      setCurrentPlayerId(gamePlayers[nextIndex].id);
      if (onMove) onMove(row, col);
      return;
    }
    
    // 3. Simulate all waves at once
    const { finalGrid, explosionWaves } = simulateExplosionsWithWaves(gridAfterPlacement, currentPlayerId);

    // 4. Perform the "disappearance" step for the first wave
    const gridBeforeExplosion = gridAfterPlacement.map(r => r.map(c => ({ ...c })));
    if (explosionWaves.length > 0) {
      const firstWaveCells = explosionWaves[0].explodingCells;
      firstWaveCells.forEach(({ row: r, col: c }: { row: number, col: number }) => {
        gridBeforeExplosion[r][c].orbs -= gridBeforeExplosion[r][c].criticalMass; 
        if (gridBeforeExplosion[r][c].orbs <= 0) gridBeforeExplosion[r][c].ownerId = undefined;
      });
      setGrid(gridBeforeExplosion);
      await new Promise(res => setTimeout(res, 100));
    }
    
    // 5. Store wave data and kick off the first wave by setting the index
    waveDataRef.current = { waves: explosionWaves, finalGrid, playerColor };
    setWaveIndex(0);
    if (onMove) onMove(row, col);
  };
  
  // Memoize the current animations to prevent unnecessary re-renders
  const memoizedAnimations = useMemo(() => currentAnimations, [
    currentAnimations.placement?.id,
    currentAnimations.explosions.map(e => e.id).join(','),
    currentAnimations.orbs.map(o => o.id).join(',')
  ]);
  const handleAnimationComplete = () => {
    if (waveIndex >= 0) {
      setWaveIndex(prevIndex => prevIndex + 1);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className="relative bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700">
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
            {grid.map((row, rowIndex) =>
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
    </div>
  );
}