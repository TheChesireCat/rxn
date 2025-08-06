'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import type { User, JoinRoomRequest, ApiResponse, Room } from '@/types/game';

interface JoinGameFormProps {
  currentUser: User;
  onBack: () => void;
}

type JoinMethod = 'roomName' | 'roomId';

export function JoinGameForm({ currentUser, onBack }: JoinGameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinMethod, setJoinMethod] = useState<JoinMethod>('roomId');
  
  // Form state
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomIdInput] = useState('');

  const extractRoomId = (input: string): string | null => {
    try {
      // Handle both full URLs and just room IDs
      if (input.includes('/room/')) {
        const parts = input.split('/room/');
        return parts[1]?.split('?')[0] || null;
      }
      
      // If it looks like a UUID, treat it as a room ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(input.trim())) {
        return input.trim();
      }
      
      // Try to handle short room names too
      if (input.trim().length > 0) {
        return input.trim();
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let roomIdValue: string;
    
    if (joinMethod === 'roomName') {
      if (!roomName.trim()) {
        setError('Please enter a room name');
        return;
      }
      roomIdValue = roomName.trim();
    } else {
      if (!roomId.trim()) {
        setError('Please enter a room ID');
        return;
      }
      
      const extractedId = extractRoomId(roomId.trim());
      if (!extractedId) {
        setError('Invalid room ID format');
        return;
      }
      roomIdValue = extractedId;
    }

    setIsLoading(true);
    setError(null);

    try {
      const joinRequest: JoinRoomRequest & { userId: string } = {
        roomId: roomIdValue,
        userName: currentUser.name,
        userId: currentUser.id,
      };

      const response = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(joinRequest),
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

      // Show spectator notification if joining as spectator
      if (result.data.playerRole === 'spectator') {
        // You could add a toast notification here if you have a toast system
        console.log('Joined as spectator - room is full or game is active');
      }

      // Navigate to the room
      router.push(`/room/${result.data.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const recentRooms = SessionManager.getRoomHistory().slice(0, 3);

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
          Join Game
        </h2>
      </div>

      {/* Recent rooms */}
      {recentRooms.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recent Rooms
          </h3>
          <div className="space-y-2">
            {recentRooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => {
                  setJoinMethod('roomId');
                  setRoomIdInput(room.roomId);
                }}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{room.roomName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {room.role === 'player' ? 'Player' : 'Spectator'} • {new Date(room.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Or join a new room:</p>
          </div>
        </div>
      )}

      {/* Join method selector */}
      <div className="mb-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setJoinMethod('roomName')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              joinMethod === 'roomName'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            disabled={isLoading}
          >
            Room Name
          </button>
          <button
            type="button"
            onClick={() => setJoinMethod('roomId')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              joinMethod === 'roomId'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            disabled={isLoading}
          >
            Room ID
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {joinMethod === 'roomName' ? (
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
        ) : (
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="Enter or paste room ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Example: 3e3f27e6-5b53-4686-9a7c-da3de93ba445
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (joinMethod === 'roomName' ? !roomName.trim() : !roomId.trim())}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Joining Room...
            </div>
          ) : (
            'Join Room'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> If the room is full, you&apos;ll join as a spectator and can watch the game.
        </p>
      </div>
    </div>
  );
}