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
  const [showDeletedNotification, setShowDeletedNotification] = useState(false);
  
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

  const winner = gameState.players.find(p => p.id === gameState.winner);
  const isCurrentUserWinner = gameState.winner === currentUserId;
  const currentUser = gameState.players.find(p => p.id === currentUserId);
  const isCurrentUserEliminated = currentUser?.isEliminated || false;
  const isHost = room?.hostId === currentUserId;

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

  // Different messages based on game end type
  const getVictoryContent = () => {
    if (gameState.status === 'runaway') {
      return {
        title: '⚡ Runaway Chain Reaction!',
        subtitle: 'The chain reaction was too complex to simulate completely.',
        winnerText: winner ? `${winner.name} triggered the runaway reaction and wins!` : 'Game ended due to runaway reaction.',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        titleColor: 'text-orange-700 dark:text-orange-300',
        subtitleColor: 'text-orange-600 dark:text-orange-400',
      };
    }

    return {
      title: '🎉 Victory!',
      subtitle: isCurrentUserWinner ? 'Congratulations! You won!' : `${winner?.name || 'Unknown'} wins!`,
      winnerText: winner ? `${winner.name} is the last player standing!` : 'Game completed.',
      bgColor: isCurrentUserWinner 
        ? 'bg-green-50 dark:bg-green-900/20' 
        : 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: isCurrentUserWinner 
        ? 'border-green-200 dark:border-green-800' 
        : 'border-blue-200 dark:border-blue-800',
      titleColor: isCurrentUserWinner 
        ? 'text-green-700 dark:text-green-300' 
        : 'text-blue-700 dark:text-blue-300',
      subtitleColor: isCurrentUserWinner 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-blue-600 dark:text-blue-400',
    };
  };

  const content = getVictoryContent();

  // Show deleted notification if room was deleted by another user
  if (showDeletedNotification) {
    return (
      <div className={`${className}`}>
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">
              🗑️ Game Deleted
            </h2>
            <p className="text-red-600 dark:text-red-400">
              The host has ended this game. Redirecting to home...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`p-6 ${content.bgColor} border ${content.borderColor} rounded-lg shadow-lg`}>
        {/* Main victory message */}
        <div className="text-center mb-4">
          <h2 className={`text-2xl sm:text-3xl font-bold ${content.titleColor} mb-2`}>
            {content.title}
          </h2>
          <p className={`text-lg ${content.subtitleColor} mb-3`}>
            {content.subtitle}
          </p>
          <p className={`text-sm ${content.subtitleColor}`}>
            {content.winnerText}
          </p>
        </div>

        {/* Game statistics */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
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

        {/* Player status for current user */}
        {isCurrentUserEliminated && !isCurrentUserWinner && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">You were eliminated</span> - You&apos;re now spectating the game
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          {isHost ? (
            <>
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
                    🗑️ End Game & Return Home
                  </>
                )}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
              >
                📊 View Game Board
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  SessionManager.clearActiveRoom();
                  router.push('/');
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
              >
                🏠 Return Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
              >
                📊 View Game Board
              </button>
            </>
          )}
        </div>

        {/* Host indicator */}
        {isHost && (
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            As the host, you can end this game for all players
          </div>
        )}
      </div>
    </div>
  );
}