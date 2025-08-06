'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import { GameRoom } from '@/components/GameRoom';
import { LobbyView } from '@/components/LobbyView';
import type { User, Room, ApiResponse } from '@/types/game';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for user session
    const session = SessionManager.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    
    setCurrentUser(session.user);
    
    // Fetch room data
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        const result: ApiResponse<Room> = await response.json();

        if (!result.success || !result.data) {
          // Clear the active room from session if it doesn't exist
          SessionManager.clearActiveRoom();
          throw new Error(result.error || 'Room not found');
        }

        setRoom(result.data);
      } catch (err) {
        // Clear the active room from session on any error
        SessionManager.clearActiveRoom();
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoom();
  }, [roomId, router]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Room Not Found
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'The requested room could not be loaded.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show lobby if game is in lobby status, otherwise show game room
  if (room.gameState.status === 'lobby') {
    return (
      <LobbyView 
        room={room} 
        currentUser={currentUser} 
        onRoomUpdate={setRoom}
      />
    );
  }

  return (
    <GameRoom 
      roomId={roomId} 
      currentUserId={currentUser.id} 
    />
  );
}