'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import type { User, Room, ApiResponse } from '@/types/game';

interface SpectatorJoinPromptProps {
  room: Room;
  currentUser: User;
  onCancel: () => void;
}

export function SpectatorJoinPrompt({ room, currentUser, onCancel }: SpectatorJoinPromptProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGameActive = room.gameState.status === 'active' || room.gameState.status === 'finished';
  const isRoomFull = room.gameState.players.length >= room.settings.maxPlayers;

  const getJoinReason = () => {
    if (isGameActive && isRoomFull) {
      return 'This game is currently active and the room is full.';
    } else if (isGameActive) {
      return 'This game is currently active.';
    } else if (isRoomFull) {
      return 'This room is full.';
    }
    return 'You can join this room as a spectator.';
  };

  const handleJoinAsSpectator = async () => {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.id,
          userName: currentUser.name,
          userId: currentUser.id,
        }),
      });

      const result: ApiResponse<{
        roomId: string;
        room: Room;
        playerRole: 'player' | 'spectator';
        playerId: string;
      }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to join room');
      }

      // Store room session
      SessionManager.storeActiveRoom({
        roomId: result.data.roomId,
        roomName: result.data.room.name,
        joinedAt: Date.now(),
        role: result.data.playerRole,
      });

      // Navigate to the room
      router.push(`/room/${result.data.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Join as Spectator
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {getJoinReason()}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            As a spectator, you can:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Watch the game in real-time
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              See all player moves and animations
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              View game statistics and timers
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Cannot make moves or interact with the board
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleJoinAsSpectator}
            disabled={isJoining}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isJoining ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Joining as Spectator...
              </div>
            ) : (
              'Join as Spectator'
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={isJoining}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Room: <span className="font-mono">{room.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
}