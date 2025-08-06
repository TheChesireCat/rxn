'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GameState } from '@/types/game';
import { AnimatedCell } from './AnimatedCell';
import { AnimationLayer } from './AnimationLayer';
import { ReactionPicker } from './ReactionPicker';
import { ReactionOverlay } from './ReactionOverlay';
import { useReactions } from '@/lib/hooks';
import { 
  generateMoveAnimations, 
  OrbAnimation, 
  ExplosionAnimation, 
  PlacementAnimation 
} from '@/lib/animationUtils';
import { processMove } from '@/lib/gameLogic';
import { PLAYER_COLORS } from '@/lib/constants';

interface GameBoardProps {
  gameState: GameState;
  currentUserId: string;
  roomId: string;
  onMove?: (row: number, col: number) => Promise<void>;
  disabled?: boolean;
}

export function GameBoard({
  gameState,
  currentUserId,
  roomId,
  onMove,
  disabled = false,
}: GameBoardProps) {
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [lastMoveError, setLastMoveError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [optimisticGameState, setOptimisticGameState] = useState<GameState | null>(null);
  const [currentAnimations, setCurrentAnimations] = useState<{
    placement?: PlacementAnimation;
    explosions: ExplosionAnimation[];
    orbs: OrbAnimation[];
  }>({ explosions: [], orbs: [] });
  const [, forceUpdate] = useState({});
  
  const previousGameState = useRef<GameState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pendingMove = useRef<{ row: number; col: number } | null>(null);

  // Use optimistic state if available, otherwise use real state
  const displayState = optimisticGameState || gameState;

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

  // Get player color for current user
  const getPlayerColor = (playerId: string): string => {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = ((hash << 5) - hash + playerId.charCodeAt(i)) & 0xffffffff;
    }
    return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
  };

  // Reset optimistic state when real state catches up
  useEffect(() => {
    if (optimisticGameState && gameState.moveCount >= optimisticGameState.moveCount) {
      setOptimisticGameState(null);
      pendingMove.current = null;
    }
  }, [gameState.moveCount, optimisticGameState]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      forceUpdate({});
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect game state changes and trigger animations
  useEffect(() => {
    // Skip if we're showing optimistic state
    if (optimisticGameState) return;

    if (previousGameState.current && previousGameState.current.moveCount < gameState.moveCount) {
      // A move was made, check if we need to animate
      const oldGrid = previousGameState.current.grid;
      const newGrid = gameState.grid;
      
      // Find the cell that was clicked (has more orbs than before)
      let moveRow = -1;
      let moveCol = -1;
      
      for (let row = 0; row < oldGrid.length; row++) {
        for (let col = 0; col < oldGrid[0].length; col++) {
          const oldCell = oldGrid[row][col];
          const newCell = newGrid[row][col];
          
          // Check if this cell had an orb added and is owned by the previous player
          if (newCell.orbs > oldCell.orbs && newCell.ownerId === previousGameState.current.currentPlayerId) {
            moveRow = row;
            moveCol = col;
            break;
          }
        }
        if (moveRow !== -1) break;
      }
      
      if (moveRow !== -1 && moveCol !== -1) {
        const playerId = previousGameState.current.currentPlayerId;
        const playerColor = getPlayerColor(playerId);
        
        const animations = generateMoveAnimations(
          oldGrid,
          newGrid,
          playerId,
          playerColor,
          moveRow,
          moveCol
        );
        
        setCurrentAnimations({
          placement: animations.placementAnimation,
          explosions: animations.explosionAnimations,
          orbs: animations.orbAnimations,
        });
        setIsAnimating(true);
      }
    }
    
    previousGameState.current = gameState;
  }, [gameState]);

  // Calculate cell size and board dimensions
  const getBoardDimensions = () => {
    const rows = displayState.grid.length;
    const cols = displayState.grid[0]?.length || 0;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    let cellSize: number;
    const gap = isMobile ? 6 : 8;
    
    // Determine cell size based on grid size and device
    if (isMobile) {
      if (cols <= 6) cellSize = 50;
      else if (cols <= 8) cellSize = 40;
      else if (cols <= 10) cellSize = 35;
      else cellSize = 30;
    } else {
      if (cols <= 6) cellSize = 80;
      else if (cols <= 8) cellSize = 65;
      else if (cols <= 10) cellSize = 55;
      else cellSize = 45;
    }
    
    // Calculate total board dimensions
    const boardWidth = (cellSize * cols) + (gap * (cols - 1));
    const boardHeight = (cellSize * rows) + (gap * (rows - 1));
    
    return { cellSize, gap, boardWidth, boardHeight, rows, cols };
  };

  const { cellSize, gap, boardWidth, boardHeight, rows, cols } = getBoardDimensions();

  const handleCellClick = async (row: number, col: number) => {
    // Prevent moves if game is finished or in runaway state
    if (gameState.status === 'finished' || gameState.status === 'runaway') {
      return;
    }

    // Check if current user is eliminated
    const currentUser = gameState.players.find(p => p.id === currentUserId);
    if (currentUser?.isEliminated) {
      return;
    }

    if (!onMove || isSubmittingMove || !isGameActive || disabled) {
      return;
    }

    // Optimistically update the UI
    const moveResult = processMove(gameState, currentUserId, row, col);
    
    if (!moveResult.success) {
      setLastMoveError(moveResult.error || 'Invalid move');
      return;
    }

    // Apply optimistic update immediately
    setOptimisticGameState(moveResult.newGameState!);
    pendingMove.current = { row, col };
    
    // Generate and start animations immediately
    const playerColor = getPlayerColor(currentUserId);
    const animations = generateMoveAnimations(
      gameState.grid,
      moveResult.newGameState!.grid,
      currentUserId,
      playerColor,
      row,
      col
    );
    
    setCurrentAnimations({
      placement: animations.placementAnimation,
      explosions: animations.explosionAnimations,
      orbs: animations.orbAnimations,
    });
    setIsAnimating(true);

    // Submit to server in background
    setIsSubmittingMove(true);
    setLastMoveError(null);

    try {
      await onMove(row, col);
      // Success - optimistic state will be cleared when real state updates
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticGameState(null);
      pendingMove.current = null;
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit move';
      setLastMoveError(errorMessage);
      console.error('Move submission failed:', error);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setCurrentAnimations({ explosions: [], orbs: [] });
  };

  // Get current player info
  const currentPlayer = displayState.players.find(p => p.id === displayState.currentPlayerId);

  return (
    <div className="w-full">
      {/* Error display */}
      {lastMoveError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
          <div className="text-red-600 dark:text-red-400 text-sm">
            {lastMoveError}
          </div>
        </div>
      )}

      {/* Smart scrollable container that adapts to content */}
      <div className="relative w-full">
        {/* Container that handles both small and large boards elegantly */}
        <div 
          className="relative mx-auto"
          style={{
            maxWidth: '100%',
            overflowX: boardWidth > (typeof window !== 'undefined' ? window.innerWidth - 64 : 800) ? 'auto' : 'visible',
            overflowY: 'visible',
          }}
        >
          {/* Inner wrapper that maintains proper dimensions */}
          <div 
            className="relative mx-auto"
            style={{
              width: boardWidth > 600 ? 'max-content' : 'fit-content',
              minWidth: Math.min(boardWidth, 320),
            }}
          >
            {/* Reaction picker - positioned absolutely */}
            <div className="absolute -top-12 right-0 z-30">
              <ReactionPicker
                onReactionSelect={(emoji) => sendReaction(emoji)}
                disabled={isReactionLoading}
              />
            </div>
            
            {/* The actual game board with dynamic sizing */}
            <div 
              className={`
                relative
                bg-gradient-to-br from-gray-100 to-gray-200 
                dark:from-gray-900 dark:to-gray-800
                p-3 sm:p-4
                rounded-xl shadow-2xl
                border border-gray-300 dark:border-gray-700
                transition-all duration-300
                ${optimisticGameState ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                ${gameState.winner ? 'ring-4 ring-green-500 animate-pulse' : ''}
                ${gameState.status === 'active' ? 'hover:shadow-3xl' : ''}
              `}
              style={{
                background: gameState.status === 'active' 
                  ? `linear-gradient(135deg, ${getPlayerColor(gameState.currentPlayerId)}08, transparent)`
                  : gameState.winner
                  ? `linear-gradient(135deg, ${getPlayerColor(gameState.winner)}15, transparent)`
                  : undefined,
                width: 'fit-content',
                minWidth: `${boardWidth + 32}px`, // Add padding
              }}
            >
              {/* Current player indicator band */}
              {gameState.status === 'active' && currentPlayer && (
                <div 
                  className="absolute -top-2 left-4 right-4 h-1 rounded-full animate-pulse"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${getPlayerColor(currentPlayer.id)}, transparent)`,
                  }}
                />
              )}
              
              {/* The grid container with exact dimensions */}
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
                {displayState.grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <AnimatedCell
                      key={`${rowIndex}-${colIndex}`}
                      cell={cell}
                      row={rowIndex}
                      col={colIndex}
                      players={displayState.players}
                      isCurrentPlayerTurn={isCurrentPlayerTurn && isGameActive}
                      currentPlayerId={currentUserId}
                      onCellClick={handleCellClick}
                      disabled={disabled || isSubmittingMove || !isGameActive}
                      isAnimating={isAnimating}
                      shouldPulse={cell.orbs >= cell.criticalMass && !isAnimating}
                    />
                  ))
                )}
              </div>

              {/* Grid size indicator */}
              <div className="absolute bottom-1 left-2 text-[10px] text-gray-400 dark:text-gray-500 font-mono opacity-60">
                {rows}×{cols}
              </div>
            </div>

            {/* Visual hint for scrollable boards */}
            {boardWidth > (typeof window !== 'undefined' ? window.innerWidth - 64 : 800) && (
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 animate-pulse">
                <div className="text-gray-400 text-2xl">→</div>
              </div>
            )}
          </div>
        </div>

        {/* Animation layer */}
        <AnimationLayer
          placementAnimation={currentAnimations.placement}
          explosionAnimations={currentAnimations.explosions}
          orbAnimations={currentAnimations.orbs}
          cellSize={cellSize}
          gap={gap}
          onAnimationComplete={handleAnimationComplete}
        />

        {/* Reaction overlay */}
        <ReactionOverlay reactions={reactions} />
      </div>

      {/* Loading indicator - more subtle for optimistic updates */}
      {(isSubmittingMove || isAnimating) && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
            {isAnimating && (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Processing chain reaction...</span>
              </>
            )}
            {isSubmittingMove && !isAnimating && (
              <span className="text-xs text-gray-500">Syncing...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}