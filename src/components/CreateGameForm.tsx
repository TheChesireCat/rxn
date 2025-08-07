'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import { useMobile } from '@/lib/hooks/useMobile';
import type { User, CreateRoomRequest, RoomSettings, ApiResponse, Room } from '@/types/game';

interface CreateGameFormProps {
  currentUser: User;
  onBack: () => void;
}

export function CreateGameForm({ currentUser, onBack }: CreateGameFormProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state with smart defaults based on device type
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [boardRows, setBoardRows] = useState(isMobile ? 8 : 6);
  const [boardCols, setBoardCols] = useState(isMobile ? 6 : 8);
  const [boardSizeMode, setBoardSizeMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState(isMobile ? '8x6' : '6x8');
  const [gameTimeLimit, setGameTimeLimit] = useState<number | undefined>(30 * 60); // 30 minutes in seconds
  const [moveTimeLimit, setMoveTimeLimit] = useState<number | undefined>(undefined);
  const [undoEnabled, setUndoEnabled] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  // Update defaults when mobile state changes (on resize)
  useEffect(() => {
    if (boardSizeMode === 'preset') {
      const defaultPreset = isMobile ? '8x6' : '6x8';
      setSelectedPreset(defaultPreset);
      const [rows, cols] = defaultPreset.split('x').map(Number);
      setBoardRows(rows);
      setBoardCols(cols);
    }
  }, [isMobile, boardSizeMode]);

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

      const createRequest: CreateRoomRequest & { hostId: string; hostName: string } = {
        name: roomName.trim(),
        settings,
        hostId: currentUser.id,
        hostName: currentUser.name,
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
            
            {/* Mode Toggle */}
            <div className="flex mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setBoardSizeMode('preset')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  boardSizeMode === 'preset'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                disabled={isLoading}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setBoardSizeMode('custom')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  boardSizeMode === 'custom'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                disabled={isLoading}
              >
                Custom
              </button>
            </div>

            {boardSizeMode === 'preset' ? (
              <select
                value={selectedPreset}
                onChange={(e) => {
                  setSelectedPreset(e.target.value);
                  const [rows, cols] = e.target.value.split('x').map(Number);
                  setBoardRows(rows);
                  setBoardCols(cols);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              >
                <optgroup label="Square">
                  <option value="6x6">6×6 (Small Square)</option>
                  <option value="8x8">8×8 (Medium Square)</option>
                  <option value="10x10">10×10 (Large Square)</option>
                </optgroup>
                <optgroup label="Landscape">
                  <option value="5x8">5×8 (Small Landscape)</option>
                  <option value="6x8">6×8 (Medium Landscape)</option>
                  <option value="6x10">6×10 (Large Landscape)</option>
                  <option value="8x10">8×10 (Wide Landscape)</option>
                </optgroup>
                <optgroup label="Portrait">
                  <option value="8x5">8×5 (Small Portrait)</option>
                  <option value="8x6">8×6 (Medium Portrait)</option>
                  <option value="10x6">10×6 (Large Portrait)</option>
                  <option value="10x8">10×8 (Wide Portrait)</option>
                </optgroup>
              </select>
            ) : (
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
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: {boardRows}×{boardCols} ({boardRows * boardCols} cells)
            </p>
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