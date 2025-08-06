'use client';

import React, { useState } from 'react';
import { GameState, RoomSettings } from '@/types/game';
import { GameTimer } from './GameTimer';
import { MoveTimer } from './MoveTimer';

interface GameControlsProps {
  gameState: GameState;
  roomSettings: RoomSettings;
  currentUserId: string;
  gameStartTime: number;
  onUndo?: () => Promise<void>;
  onRefresh?: () => void;
  onGameTimeout?: () => void;
  onMoveTimeout?: () => void;
  className?: string;
}

export function GameControls({ 
  gameState, 
  roomSettings, 
  currentUserId, 
  gameStartTime,
  onUndo, 
  onRefresh,
  onGameTimeout,
  onMoveTimeout,
  className = '' 
}: GameControlsProps) {
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const isCurrentUserTurn = gameState.currentPlayerId === currentUserId;
  const isGameActive = gameState.status === 'active';
  const canUndo = roomSettings.undoEnabled && isCurrentUserTurn && isGameActive && gameState.moveCount > 0;

  const handleUndo = async () => {
    if (!onUndo || !canUndo) return;

    setIsUndoing(true);
    setUndoError(null);

    try {
      await onUndo();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to undo move';
      setUndoError(errorMessage);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className={`${className}`}>
      {/* Game status display - only for lobby state */}
      <div className="text-center mb-4">
        {gameState.status === 'lobby' && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Waiting in Lobby
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              Game will start when all players are ready.
            </div>
          </div>
        )}
      </div>

      {/* Timer components */}
      {isGameActive && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Game timer */}
          <GameTimer
            gameStartTime={gameStartTime}
            gameTimeLimit={roomSettings.gameTimeLimit}
            isGameActive={isGameActive}
            onTimeout={onGameTimeout}
            className="flex-shrink-0"
          />
          
          {/* Move timer */}
          <MoveTimer
            turnStartedAt={gameState.turnStartedAt}
            moveTimeLimit={roomSettings.moveTimeLimit}
            isCurrentPlayerTurn={isCurrentUserTurn}
            isGameActive={isGameActive}
            onTimeout={onMoveTimeout}
            className="flex-shrink-0"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
        {/* Enhanced Undo button */}
        {roomSettings.undoEnabled && (
          <button
            onClick={handleUndo}
            disabled={!canUndo || isUndoing}
            className={`
              group px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 btn-enhanced
              flex items-center gap-2 min-w-32 hover:shadow-xl
              ${canUndo && !isUndoing
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-glow transform hover:scale-105' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-75'
              }
            `}
            title={
              !roomSettings.undoEnabled 
                ? 'Undo is disabled in this game'
                : !isCurrentUserTurn 
                  ? 'You can only undo on your turn'
                  : !isGameActive
                    ? 'Game is not active'
                    : gameState.moveCount === 0
                      ? 'No moves to undo'
                      : 'Undo your last move'
            }
          >
            {isUndoing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Undoing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Undo Move</span>
              </>
            )}
          </button>
        )}

        {/* Enhanced Refresh button */}
        <button
          onClick={handleRefresh}
          className="
            group px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 btn-enhanced
            bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
            text-white shadow-glow hover:shadow-xl transform hover:scale-105
            flex items-center gap-2
          "
          title="Refresh game state"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Error display */}
      {undoError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-700 dark:text-red-300 text-sm text-center">
            {undoError}
          </div>
        </div>
      )}

      {/* Game info */}
      <div className="mt-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex flex-col sm:flex-row sm:justify-center sm:gap-6 gap-1">
          <span>Board: {gameState.grid.length} × {gameState.grid[0]?.length || 0}</span>
          <span>Total Moves: {gameState.moveCount}</span>
          <span>Players: {gameState.players.filter(p => !p.isEliminated).length}/{gameState.players.length}</span>
        </div>
        
        {/* Settings info */}
        <div className="mt-2 flex flex-col sm:flex-row sm:justify-center sm:gap-4 gap-1 text-xs text-gray-500 dark:text-gray-500">
          {roomSettings.undoEnabled && <span>✓ Undo enabled</span>}
          {roomSettings.gameTimeLimit && <span>⏱ Game limit: {roomSettings.gameTimeLimit}min</span>}
          {roomSettings.moveTimeLimit && <span>⏰ Move limit: {roomSettings.moveTimeLimit}s</span>}
        </div>
      </div>
    </div>
  );
}