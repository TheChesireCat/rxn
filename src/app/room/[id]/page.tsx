'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import { GameRoom } from '@/components/GameRoom';
import { LobbyView } from '@/components/LobbyView';
import type { User, Room, ApiResponse, Player } from '@/types/game';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Check for user session
    const session = SessionManager.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    
    setCurrentUser(session.user);
    
    // Fetch room data and auto-join if needed
    const initializeRoom = async () => {
      try {
        // First, fetch the room to check its status
        const response = await fetch(`/api/room/${roomId}`);
        const result: ApiResponse<Room> = await response.json();

        if (!result.success || !result.data) {
          SessionManager.clearActiveRoom();
          throw new Error(result.error || 'Room not found');
        }

        const roomData = result.data;
        
        // Check if user is already a player in the room
        const isAlreadyPlayer = roomData.gameState.players.some(
          (p: Player) => p.id === session.user.id
        );

        // If not a player and room is not full/finished, try to join
        if (!isAlreadyPlayer && 
            roomData.gameState.status === 'lobby' && 
            roomData.gameState.players.length < roomData.settings.maxPlayers) {
          
          setIsJoining(true);
          
          try {
            // Auto-join the room as a player
            const joinResponse = await fetch('/api/room/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomId: roomId,
                userName: session.user.name,
                userId: session.user.id,
              }),
            });

            const joinResult = await joinResponse.json();

            if (joinResult.success && joinResult.data) {
              // Update room with the joined data
              setRoom(joinResult.data.room);
              
              // Store in session that we've joined this room
              SessionManager.storeActiveRoom({
                roomId: roomId,
                roomName: joinResult.data.room.name,
                joinedAt: Date.now(),
                role: joinResult.data.playerRole as 'player' | 'spectator',
              });

              // Log the join status
              console.log(`Joined room as ${joinResult.data.playerRole}`, 
                joinResult.data.spectatorReason ? `(${joinResult.data.spectatorReason})` : '');
            } else {
              // Join failed, just show the room as spectator
              setRoom(roomData);
              console.error('Failed to join room:', joinResult.error);
            }
          } catch (joinError) {
            // Join failed, show room anyway (as spectator)
            console.error('Error joining room:', joinError);
            setRoom(roomData);
          } finally {
            setIsJoining(false);
          }
        } else {
          // User is already a player or room is not joinable
          setRoom(roomData);
          
          // Store/update active room in session
          const role = isAlreadyPlayer ? 'player' : 'spectator';
          SessionManager.storeActiveRoom({
            roomId: roomId,
            roomName: roomData.name,
            joinedAt: Date.now(),
            role: role,
          });
        }
      } catch (err) {
        SessionManager.clearActiveRoom();
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeRoom();
  }, [roomId, router]);

  if (isLoading || isJoining) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isJoining ? 'Joining room...' : 'Loading room...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !room || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-w-md w-full">
          <div className="text-4xl mb-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="1em" 
              height="1em" 
              viewBox="0 0 24 24"
              className="inline-block text-red-600 dark:text-red-400"
            >
              <path 
                fill="currentColor" 
                d="M22 14h-1c0-3.87-3.13-7-7-7h-1V5.73A2 2 0 1 0 10 4c0 .74.4 1.39 1 1.73V7h-1c-3.87 0-7 3.13-7 7H2c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h1v1a2 2 0 0 0 2 2h14c1.11 0 2-.89 2-2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1M9.86 16.68l-1.18 1.18l-1.18-1.18l-1.18 1.18l-1.18-1.18l1.18-1.18l-1.18-1.18l1.18-1.18l1.18 1.18l1.18-1.18l1.18 1.18l-1.18 1.18zm9 0l-1.18 1.18l-1.18-1.18l-1.18 1.18l-1.18-1.18l1.18-1.18l-1.18-1.18l1.18-1.18l1.18 1.18l1.18-1.18l1.18 1.18l-1.18 1.18z" 
              />
            </svg>
          </div>
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
