'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GameState, Cell } from '@/types/game';
import { AnimatedCell } from './AnimatedCell';
import { AnimationLayer } from './AnimationLayer';
import { ReactionPicker } from './ReactionPicker';
import { ReactionOverlay } from './ReactionOverlay';
import { useReactions } from '@/lib/hooks';
import {
  OrbAnimation,
  ExplosionAnimation,
  PlacementAnimation
} from '@/lib/animationUtils';


// Stable empty arrays defined outside component to prevent re-renders
const EMPTY_EXPLOSIONS: ExplosionAnimation[] = [];
const EMPTY_ORBS: OrbAnimation[] = [];

interface GameBoardProps {
  gameState: GameState;
  currentUserId: string;
  roomId: string;
  onMove?: (row: number, col: number) => Promise<void>;
  disabled?: boolean;
  onDisplayStateChange?: (state: GameState) => void;
}

export function GameBoard({
  gameState,
  currentUserId,
  roomId,
  onMove,
  disabled = false,
  onDisplayStateChange,
}: GameBoardProps) {
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [lastMoveError, setLastMoveError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimations, setCurrentAnimations] = useState<{
    placement?: PlacementAnimation;
    explosions: ExplosionAnimation[];
    orbs: OrbAnimation[];
  }>({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
  const [explodingCells, setExplodingCells] = useState<Set<string>>(new Set());
  const [hasShownWinAnimation, setHasShownWinAnimation] = useState(false);

  // Reset animation flag when game state changes to non-winning
  useEffect(() => {
    if (gameState.status !== 'finished' && gameState.status !== 'runaway') {
      setHasShownWinAnimation(false);
    }
  }, [gameState.status]);

  // NEW: Reset all animation state when a new game starts (moveCount === 0)
  useEffect(() => {
    if (gameState.moveCount === 0) {
      // Reset all animation-related state variables
      setIsAnimating(false);
      setCurrentAnimations({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
      setExplodingCells(new Set());
      setHasShownWinAnimation(false);
      setAnimatingGrid(null);
      setWaveIndex(-1);

      // Clear animation refs
      waveDataRef.current = null;
      lastProcessedMove.current = null;
      pendingMove.current = null;

      // Reset display state to match game state to prevent race condition
      setDisplayState(gameState);
    }
  }, [gameState.moveCount, gameState]);

  // NEW: Separate display state from actual game state
  // Initialize without winner info if this is a winning state that needs animation
  const [displayState, setDisplayState] = useState<GameState>(() => {
    // If game is finished/runaway and has lastMove, start without winner for animation
    if ((gameState.status === 'finished' || gameState.status === 'runaway') && gameState.lastMove) {
      return {
        ...gameState,
        // Keep the original status, just hide winner to prevent modal flashing
        winner: undefined // Hide winner until animation completes
      };
    }
    return gameState;
  });
  const [animatingGrid, setAnimatingGrid] = useState<Cell[][] | null>(null);

  // State for managing wave-by-wave animations
  const [waveIndex, setWaveIndex] = useState(-1); // -1: inactive, 0+: a wave is running
  const waveDataRef = useRef<{
    waves: Array<{ explodingCells: any[]; gridState: Cell[][] }>;
    finalState: GameState;
    playerColor: string;
    rows: number;
    cols: number;
    isOwnMove: boolean;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const pendingMove = useRef<{ row: number; col: number } | null>(null);
  const lastProcessedMove = useRef<{ moveCount: number; row: number; col: number; playerId: string } | null>(null);

  const isCurrentPlayerTurn = gameState.currentPlayerId === currentUserId;
  const isGameActive = gameState.status === 'active';

  // Get current user name for reactions
  const currentUserName = gameState.players.find(p => p.id === currentUserId)?.name || 'Unknown';

  // Reactions hook
  const { reactions, sendReaction, isLoading: isReactionLoading } = useReactions({
    roomId,
    currentUserId,
    currentUserName,
  });



  // Helper function to get adjacent cells
  function getAdjacentCells(row: number, col: number, rows: number, cols: number): Array<{ row: number; col: number }> {
    const adjacent = [];
    if (row > 0) adjacent.push({ row: row - 1, col });
    if (row < rows - 1) adjacent.push({ row: row + 1, col });
    if (col > 0) adjacent.push({ row, col: col - 1 });
    if (col < cols - 1) adjacent.push({ row, col: col + 1 });
    return adjacent;
  }

  // Simulate all explosion waves
  function simulateExplosionsWithWaves(initialGrid: Cell[][], playerId: string) {
    const rows = initialGrid.length;
    const cols = initialGrid[0].length;
    let gridForCurrentWave = initialGrid.map(row => row.map(cell => ({ ...cell })));
    const explosionWaves = [];
    const maxWaves = 100;
    let wave = 0;

    while (wave < maxWaves) {
      const unstableCells: Array<{ row: number; col: number }> = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (gridForCurrentWave[r][c].orbs >= gridForCurrentWave[r][c].criticalMass) {
            unstableCells.push({ row: r, col: c });
          }
        }
      }

      if (unstableCells.length === 0) break;

      explosionWaves.push({
        explodingCells: [...unstableCells],
        gridState: gridForCurrentWave.map(row => row.map(cell => ({ ...cell })))
      });

      const gridForNextWave = gridForCurrentWave.map(row => row.map(cell => ({ ...cell })));

      unstableCells.forEach(({ row, col }) => {
        gridForNextWave[row][col].orbs -= gridForCurrentWave[row][col].criticalMass;
        const neighbors = getAdjacentCells(row, col, rows, cols);
        neighbors.forEach(adj => {
          gridForNextWave[adj.row][adj.col].orbs += 1;
          gridForNextWave[adj.row][adj.col].ownerId = playerId;
        });
      });

      unstableCells.forEach(({ row, col }) => {
        if (gridForNextWave[row][col].orbs <= 0) {
          gridForNextWave[row][col].ownerId = undefined;
        }
      });

      gridForCurrentWave = gridForNextWave;
      wave++;
    }

    if (wave >= maxWaves) {
      console.warn(`Hit maximum wave limit of ${maxWaves}. Chain reaction may be incomplete.`);
    }

    return { finalGrid: gridForCurrentWave, explosionWaves };
  }

  // Detect new moves and trigger animations
  useEffect(() => {
    // Skip if no move info or if we already processed this move
    if (!gameState.lastMove ||
      (lastProcessedMove.current &&
        lastProcessedMove.current.moveCount === gameState.moveCount)) {
      return;
    }

    // Skip if currently animating
    if (isAnimating) {
      return;
    }

    const { row, col, playerId } = gameState.lastMove;
    const isOwnMove = playerId === currentUserId;

    // Mark this move as processed
    lastProcessedMove.current = {
      moveCount: gameState.moveCount,
      row,
      col,
      playerId
    };

    // Get the player who made the move
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      // No player found, just update display state directly
      setDisplayState(gameState);
      return;
    }

    const playerColor = player.color;

    // Get the grid before the move (from display state, which hasn't updated yet)
    const gridBeforeMove = displayState.grid.map(r => r.map(c => ({ ...c })));

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
      // Just update the display state after a short delay for the placement animation
      setIsAnimating(true);
      setAnimatingGrid(gridAfterPlacement);

      setTimeout(() => {
        // For winning moves, mark animation as shown and show final state
        if (gameState.status === 'finished' || gameState.status === 'runaway') {
          setHasShownWinAnimation(true);
        }
        setDisplayState(gameState);
        setAnimatingGrid(null);
        setIsAnimating(false);
      }, 200); // Increased from 50ms for smoother transition
      return;
    }

    // Explosions will happen - simulate them
    const { explosionWaves } = simulateExplosionsWithWaves(gridAfterPlacement, playerId);

    if (explosionWaves.length === 0) {
      // No explosions after all, mark animation as shown if it's a winning move
      if (gameState.status === 'finished' || gameState.status === 'runaway') {
        setHasShownWinAnimation(true);
      }
      setDisplayState(gameState);
      return;
    }

    // Start animation sequence
    setIsAnimating(true);

    // Show placement first
    setAnimatingGrid(gridAfterPlacement);

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
        setAnimatingGrid(gridBeforeExplosion);
      }

      // Start wave animations after disappearance
      setTimeout(() => {
        // Hide winner status during animations by updating displayState
        if (gameState.status === 'finished' || gameState.status === 'runaway') {
          setDisplayState(prev => ({
            ...prev,
            // Don't change status to prevent modal flashing, just hide winner
            winner: undefined // Hide winner until animation completes
          }));
        }

        waveDataRef.current = {
          waves: explosionWaves,
          finalState: gameState, // Store the final state to apply after animations
          playerColor,
          rows: gameState.grid.length,
          cols: gameState.grid[0].length,
          isOwnMove
        };
        setWaveIndex(0);
      }, 50);
    }, 50);

  }, [gameState.lastMove, gameState.moveCount, currentUserId, displayState.grid, isAnimating]);

  // Notify parent about display state changes for victory timing
  useEffect(() => {
    if (onDisplayStateChange) {
      // Only notify parent with winner if animations are done
      if (displayState.winner && !hasShownWinAnimation) {
        // Send state without winner until animations complete
        onDisplayStateChange({
          ...displayState,
          status: 'active',
          winner: undefined
        });
      } else {
        // Safe to send full state (either no winner, or animations completed)
        onDisplayStateChange(displayState);
      }
    }
  }, [displayState, onDisplayStateChange, hasShownWinAnimation]);

  // Update display state when game state changes (but not during animations)
  useEffect(() => {
    // If not animating and no pending animations, update display state
    if (!isAnimating && waveIndex === -1 && !animatingGrid) {
      // Check if this is a winning move that needs animation delay
      if ((gameState.status === 'finished' || gameState.status === 'runaway') &&
        gameState.lastMove &&
        displayState.status === 'active') {
        // This is a winning move - keep displayState as active until animations complete
        // Don't update displayState yet, let the animation system handle it
        return;
      }

      // For non-winning moves or when no lastMove info, update directly
      if (gameState.moveCount !== displayState.moveCount && !gameState.lastMove) {
        setDisplayState(gameState);
      } else if (!gameState.lastMove) {
        // No lastMove means this isn't an animated move, safe to update
        setDisplayState(gameState);
      }
    }
  }, [gameState, isAnimating, waveIndex, animatingGrid, displayState.moveCount, displayState.status]);

  // This effect hook drives the wave-by-wave animation
  useEffect(() => {
    if (waveIndex < 0 || !waveDataRef.current) {
      if (waveIndex < 0) {
        setCurrentAnimations({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
        setExplodingCells(new Set());
      }
      return;
    }

    const { waves, finalState, playerColor, rows, cols } = waveDataRef.current;

    // Check if all waves are completed
    if (waveIndex >= waves.length) {
      // Mark that we've shown the win animation
      setHasShownWinAnimation(true);
      // All animations done - update to final state WITH victory info
      setDisplayState(finalState);
      setAnimatingGrid(null);
      setCurrentAnimations({ explosions: EMPTY_EXPLOSIONS, orbs: EMPTY_ORBS });
      setExplodingCells(new Set());
      setIsAnimating(false);
      setWaveIndex(-1);
      waveDataRef.current = null;

      // Clear pending move if this was our move
      if (pendingMove.current) {
        pendingMove.current = null;
      }
      return;
    }

    // Process the current wave
    const wave = waves[waveIndex];
    setAnimatingGrid(wave.gridState);

    const explosionAnims: ExplosionAnimation[] = [];
    const orbAnims: OrbAnimation[] = [];

    wave.explodingCells.forEach(({ row: fromRow, col: fromCol }: { row: number; col: number }) => {
      explosionAnims.push({
        id: `exp-${waveIndex}-${fromRow}-${fromCol}`,
        row: fromRow,
        col: fromCol,
        color: playerColor,
        delay: 0,
        wave: waveIndex
      });

      const neighbors = getAdjacentCells(fromRow, fromCol, rows, cols);
      neighbors.forEach(({ row: toRow, col: toCol }) => {
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

  }, [waveIndex]);

  // Calculate board dimensions
  const calculateBoardDimensions = () => {
    const grid = animatingGrid || displayState.grid;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    const reservedHeight = 160;
    const reservedWidth = 64;

    const availableWidth = viewportWidth - reservedWidth;
    const availableHeight = viewportHeight - reservedHeight;

    const maxBoardHeight = availableHeight * 0.7;
    const maxBoardWidth = availableWidth * 0.9;

    const gap = viewportWidth < 640 ? 4 : 6;

    const maxCellWidth = (maxBoardWidth - (gap * (cols - 1))) / cols;
    const maxCellHeight = (maxBoardHeight - (gap * (rows - 1))) / rows;

    let cellSize = Math.min(maxCellWidth, maxCellHeight);

    const maxSizes = viewportWidth < 640
      ? { 6: 60, 8: 50, 10: 40, default: 35 }
      : { 6: 80, 8: 70, 10: 60, default: 50 };

    const maxAllowed = cols <= 6 ? maxSizes[6]
      : cols <= 8 ? maxSizes[8]
        : cols <= 10 ? maxSizes[10]
          : maxSizes.default;

    cellSize = Math.min(cellSize, maxAllowed);
    cellSize = Math.max(cellSize, 30);

    const boardWidth = (cellSize * cols) + (gap * (cols - 1));
    const boardHeight = (cellSize * rows) + (gap * (rows - 1));

    return {
      cellSize: Math.floor(cellSize),
      gap,
      boardWidth: Math.floor(boardWidth),
      boardHeight: Math.floor(boardHeight),
      rows,
      cols
    };
  };

  const { cellSize, gap, boardWidth, boardHeight, rows, cols } = calculateBoardDimensions();

  const handleCellClick = async (row: number, col: number) => {
    if (gameState.status === 'finished' || gameState.status === 'runaway') {
      return;
    }

    const currentUser = gameState.players.find(p => p.id === currentUserId);
    if (currentUser?.isEliminated) {
      return;
    }

    if (!onMove || isSubmittingMove || !isGameActive || disabled || isAnimating) {
      return;
    }

    // Validate move
    const cell = displayState.grid[row][col];
    if (cell.ownerId && cell.ownerId !== currentUserId) {
      return;
    }

    // Mark as pending move
    pendingMove.current = { row, col };

    // Submit to server immediately
    setIsSubmittingMove(true);
    setLastMoveError(null);

    try {
      await onMove(row, col);
      // The animation will be triggered by the gameState update
    } catch (error) {
      pendingMove.current = null;
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit move';
      setLastMoveError(errorMessage);
      console.error('Move submission failed:', error);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  // Handle animation completion - advance to next wave
  const handleAnimationComplete = () => {
    if (waveIndex >= 0 && waveDataRef.current) {
      setWaveIndex(prevIndex => prevIndex + 1);
    }
  };

  // Get current player info for display
  const currentPlayer = displayState.players.find(p => p.id === displayState.currentPlayerId);

  // Grid to display (either animating grid or display state grid)
  const gridToDisplay = animatingGrid || displayState.grid;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Error display */}
      {lastMoveError && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 animate-slide-down">
          <div className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg text-sm">
            {lastMoveError}
          </div>
        </div>
      )}

      {/* Game board container */}
      <div className="relative">
        {/* Reaction picker */}
        <div className="absolute -top-12 right-0 z-30 sm:right-4">
          <ReactionPicker
            onReactionSelect={(emoji) => sendReaction(emoji)}
            disabled={isReactionLoading}
          />
        </div>

        {/* The game board */}
        <div
          className={`
            relative
            bg-white dark:bg-gray-900
            p-4 sm:p-6
            rounded-2xl shadow-2xl
            border-2 border-gray-200 dark:border-gray-700
            transition-all duration-300
            ${pendingMove.current ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
            ${displayState.winner ? 'ring-4 ring-green-500' : ''}
          `}
          style={{
            background: currentPlayer && gameState.status === 'active'
              ? `linear-gradient(135deg, ${currentPlayer.color}08, transparent)`
              : undefined,
          }}
        >
          {/* Current turn indicator */}
          {gameState.status === 'active' && currentPlayer && (
            <div
              className="absolute -top-0.5 left-6 right-6 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${currentPlayer.color}, transparent)`,
                animation: 'glow 2s ease-in-out infinite',
              }}
            />
          )}

          {/* The grid */}
          <div
            ref={boardRef}
            className="grid relative"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gap: `${gap}px`,
              width: `${boardWidth}px`,
              height: `${boardHeight}px`,
            }}
          >
            {gridToDisplay.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isExploding = explodingCells.has(`${rowIndex}-${colIndex}`);
                return (
                  <AnimatedCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell}
                    row={rowIndex}
                    col={colIndex}
                    players={displayState.players}
                    isCurrentPlayerTurn={isCurrentPlayerTurn && isGameActive}
                    currentPlayerId={currentUserId}
                    onCellClick={handleCellClick}
                    disabled={disabled || isSubmittingMove || !isGameActive || isAnimating}
                    isAnimating={isAnimating}
                    shouldPulse={cell.orbs >= cell.criticalMass && !isAnimating}
                    isExploding={isExploding}
                    cellSize={cellSize}
                  />
                );
              })
            )}

            {/* Animation layer */}
            <AnimationLayer
              placementAnimation={currentAnimations.placement}
              explosionAnimations={currentAnimations.explosions}
              orbAnimations={currentAnimations.orbs}
              cellSize={cellSize}
              gap={gap}
              onAnimationComplete={handleAnimationComplete}
              key={`animation-wave-${waveIndex}`}
            />
          </div>

          {/* Grid size label */}
          <div className="absolute bottom-2 left-3 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
            {rows}×{cols}
          </div>
        </div>

        {/* Reaction overlay */}
        <ReactionOverlay reactions={reactions} />
      </div>

      {/* Status indicators */}
      {(isSubmittingMove || isAnimating) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-full shadow-lg">
            {isAnimating && (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Processing...</span>
              </>
            )}
            {isSubmittingMove && !isAnimating && (
              <span className="text-xs text-gray-500 dark:text-gray-500">Syncing...</span>
            )}
          </div>
        </div>
      )}

      {/* Glow animation for turn indicator */}
      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}