'use client';

import React, { useState, useEffect } from 'react';
import { GameState, Player, Room } from '@/types/game';
import { useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';

interface VictoryMessageProps {
  gameState: GameState;
  currentUserId: string;
  room?: Room;
  className?: string;
}

export function VictoryMessage({ gameState, currentUserId, room, className = '' }: VictoryMessageProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showDeletedNotification, setShowDeletedNotification] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Check if the game has been deleted (room becomes null while we're viewing)
  useEffect(() => {
    if (showDeletedNotification) {
      const timer = setTimeout(() => {
        SessionManager.clearActiveRoom();
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDeletedNotification, router]);

  if (gameState.status !== 'finished' && gameState.status !== 'runaway') {
    return null;
  }

  // Don't render if user has closed the victory message
  if (!isVisible) {
    return null;
  }

  const winner = gameState.players.find(p => p.id === gameState.winner);
  const isCurrentUserWinner = gameState.winner === currentUserId;
  const currentUser = gameState.players.find(p => p.id === currentUserId);
  const isCurrentUserEliminated = currentUser?.isEliminated || false;
  const isHost = room?.hostId === currentUserId;
  const isSpectator = !gameState.players.some(p => p.id === currentUserId);

  // Handle restart game (for host only)
  const handleRestartGame = async () => {
    if (!room || !isHost) return;
    
    setIsRestarting(true);
    try {
      const response = await fetch('/api/game/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.id,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        // Refresh the page to show the new game
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Failed to restart game:', error);
        setIsRestarting(false);
      }
    } catch (error) {
      console.error('Error restarting game:', error);
      setIsRestarting(false);
    }
  };

  // Handle delete game (for host only)
  const handleDeleteGame = async () => {
    if (!room || !isHost) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/room/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.id,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        // Clear session and redirect
        SessionManager.clearActiveRoom();
        router.push('/');
      } else {
        const error = await response.json();
        console.error('Failed to delete room:', error);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setIsDeleting(false);
    }
  };

  // Different messages and styles based on whether user won or lost
  const getVictoryContent = () => {
    if (gameState.status === 'runaway') {
      return {
        title: '⚡ Runaway Chain Reaction!',
        subtitle: 'The chain reaction was too complex to simulate completely.',
        mainMessage: winner ? `${winner.name} triggered the runaway reaction and wins!` : 'Game ended due to runaway reaction.',
        bgColor: 'bg-orange-100/95 dark:bg-orange-900/95',
        borderColor: 'border-orange-300 dark:border-orange-700',
        titleColor: 'text-orange-800 dark:text-orange-200',
        subtitleColor: 'text-orange-700 dark:text-orange-300',
      };
    }

    if (isCurrentUserWinner) {
      return {
        title: '🎉 Victory!',
        subtitle: 'Congratulations!',
        mainMessage: 'You are the champion! All opponents have been eliminated.',
        bgColor: 'bg-green-100/95 dark:bg-green-900/95',
        borderColor: 'border-green-300 dark:border-green-700',
        titleColor: 'text-green-800 dark:text-green-200',
        subtitleColor: 'text-green-700 dark:text-green-300',
      };
    } else if (isSpectator) {
      return {
        title: '🏁 Game Over',
        subtitle: 'The game has ended',
        mainMessage: `${winner?.name || 'Unknown'} has won the game!`,
        bgColor: 'bg-gray-100/95 dark:bg-gray-800/95',
        borderColor: 'border-gray-300 dark:border-gray-600',
        titleColor: 'text-gray-800 dark:text-gray-200',
        subtitleColor: 'text-gray-700 dark:text-gray-300',
      };
    } else {
      return {
        title: '💀 Defeated',
        subtitle: 'You have been eliminated',
        mainMessage: `${winner?.name || 'Unknown'} has won the game. Better luck next time!`,
        bgColor: 'bg-red-100/95 dark:bg-red-900/95',
        borderColor: 'border-red-300 dark:border-red-700',
        titleColor: 'text-red-800 dark:text-red-200',
        subtitleColor: 'text-red-700 dark:text-red-300',
      };
    }
  };

  const content = getVictoryContent();

  // Show deleted notification if room was deleted by another user
  if (showDeletedNotification) {
    return (
      <div className={`${className}`}>
        <div className="p-6 bg-red-100/95 dark:bg-red-900/95 border-2 border-red-300 dark:border-red-700 rounded-xl shadow-2xl backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
              🗑️ Game Deleted
            </h2>
            <p className="text-red-700 dark:text-red-300">
              The host has ended this game. Redirecting to home...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`relative p-6 ${content.bgColor} border-2 ${content.borderColor} rounded-xl shadow-2xl backdrop-blur-sm`}>
        {/* Close button for losers/spectators */}
        {!isCurrentUserWinner && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Close victory message"
          >
            <span className="text-gray-600 dark:text-gray-300 text-lg">×</span>
          </button>
        )}

        {/* Main victory message */}
        <div className="text-center mb-4">
          <h2 className={`text-2xl sm:text-3xl font-bold ${content.titleColor} mb-2`}>
            {content.title}
          </h2>
          <p className={`text-lg font-semibold ${content.subtitleColor} mb-3`}>
            {content.subtitle}
          </p>
          <p className={`text-sm ${content.subtitleColor}`}>
            {content.mainMessage}
          </p>
        </div>

        {/* Game statistics */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-700 dark:text-gray-300">Total Moves</div>
              <div className="text-gray-600 dark:text-gray-400">{gameState.moveCount}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 dark:text-gray-300">Players</div>
              <div className="text-gray-600 dark:text-gray-400">{gameState.players.length}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 dark:text-gray-300">Eliminated</div>
              <div className="text-gray-600 dark:text-gray-400">
                {gameState.players.filter(p => p.isEliminated).length}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 dark:text-gray-300">Winner Orbs</div>
              <div className="text-gray-600 dark:text-gray-400">
                {winner?.orbCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          {isHost ? (
            <>
              <button
                onClick={handleRestartGame}
                disabled={isRestarting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRestarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Restarting...
                  </>
                ) : (
                  <>
                    🔄 Play Again
                  </>
                )}
              </button>
              <button
                onClick={handleDeleteGame}
                disabled={isDeleting}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    🗑️ End Game
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                SessionManager.clearActiveRoom();
                router.push('/');
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
            >
              🏠 Return Home
            </button>
          )}
          
          {/* View board button for all users */}
          {!isCurrentUserWinner && (
            <button
              onClick={() => setIsVisible(false)}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
            >
              📊 Continue Watching
            </button>
          )}
        </div>

        {/* Host indicator */}
        {isHost && (
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            As the host, you can restart or end this game for all players
          </div>
        )}
      </div>
    </div>
  );
}