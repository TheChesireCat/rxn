'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import type { User, CreateRoomRequest, RoomSettings, ApiResponse, Room } from '@/types/game';

interface CreateGameFormProps {
  currentUser: User;
  onBack: () => void;
}

export function CreateGameForm({ currentUser, onBack }: CreateGameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [boardRows, setBoardRows] = useState(6);
  const [boardCols, setBoardCols] = useState(8);
  const [gameTimeLimit, setGameTimeLimit] = useState<number | undefined>(undefined);
  const [moveTimeLimit, setMoveTimeLimit] = useState<number | undefined>(undefined);
  const [undoEnabled, setUndoEnabled] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const settings: RoomSettings = {
        maxPlayers,
        boardSize: { rows: boardRows, cols: boardCols },
        gameTimeLimit: gameTimeLimit || undefined,
        moveTimeLimit: moveTimeLimit || undefined,
        undoEnabled,
        isPrivate,
      };

      const createRequest: CreateRoomRequest & { hostId: string } = {
        name: roomName.trim(),
        settings,
        hostId: currentUser.id,
      };

      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest),
      });

      const result: ApiResponse<Room> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create room');
      }

      // Store room session
      SessionManager.storeActiveRoom({
        roomId: result.data.id,
        roomName: result.data.name,
        joinedAt: Date.now(),
        role: 'player',
      });

      // Navigate to the room
      router.push(`/room/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create New Game
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Name */}
        <div>
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Room Name
          </label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        {/* Game Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Players
            </label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} Players</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Board Size
            </label>
            <div className="flex space-x-2">
              <select
                value={boardRows}
                onChange={(e) => setBoardRows(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span className="flex items-center text-gray-500 dark:text-gray-400">×</span>
              <select
                value={boardCols}
                onChange={(e) => setBoardCols(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Time Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gameTimeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game Time Limit (minutes)
            </label>
            <input
              type="number"
              id="gameTimeLimit"
              value={gameTimeLimit ? gameTimeLimit / 60 : ''}
              onChange={(e) => setGameTimeLimit(e.target.value ? Number(e.target.value) * 60 : undefined)}
              placeholder="No limit"
              min="1"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="moveTimeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Move Time Limit (seconds)
            </label>
            <input
              type="number"
              id="moveTimeLimit"
              value={moveTimeLimit || ''}
              onChange={(e) => setMoveTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="No limit"
              min="5"
              max="300"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="undoEnabled"
              checked={undoEnabled}
              onChange={(e) => setUndoEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="undoEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Allow undo moves
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Private room (join by URL only)
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !roomName.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating Room...
            </div>
          ) : (
            'Create Room'
          )}
        </button>
      </form>
    </div>
  );
}