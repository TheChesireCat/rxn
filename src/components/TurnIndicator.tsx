'use client';

import React from 'react';
import { GameState } from '@/types/game';

interface TurnIndicatorProps {
  gameState: GameState;
  currentUserId: string;
  className?: string;
}

export function TurnIndicator({ gameState, currentUserId, className = '' }: TurnIndicatorProps) {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const isCurrentUserTurn = gameState.currentPlayerId === currentUserId;

  // Don't show turn indicator if game is not active
  if (gameState.status !== 'active' || !currentPlayer) {
    return null;
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
        {/* Player color indicator */}
        <div
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-gray-800 shadow-md"
          style={{ backgroundColor: currentPlayer.color }}
          aria-label={`Current player color: ${currentPlayer.color}`}
        />
        
        {/* Turn text */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {isCurrentUserTurn ? "Your turn" : `${currentPlayer.name}'s turn`}
          </span>
          
          {/* Move counter */}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Move #{gameState.moveCount + 1}
          </span>
        </div>
      </div>
      
      {/* Turn status indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`
          w-2 h-2 rounded-full animate-pulse
          ${isCurrentUserTurn ? 'bg-green-500' : 'bg-blue-500'}
        `} />
        <span className={`
          text-xs sm:text-sm font-medium
          ${isCurrentUserTurn 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-blue-600 dark:text-blue-400'
          }
        `}>
          {isCurrentUserTurn ? 'Waiting for your move' : 'Waiting for opponent'}
        </span>
      </div>
      
      {/* Connection status warning */}
      {!currentPlayer.isConnected && (
        <div className="mt-2 flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">Player is offline</span>
        </div>
      )}
    </div>
  );
}