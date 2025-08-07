'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager } from '@/lib/sessionManager';
import { usePresence } from '@/lib/hooks/usePresence';
import type { User, Room, Player, ApiResponse } from '@/types/game';

interface LobbyViewProps {
  room: Room;
  currentUser: User;
  onRoomUpdate: (room: Room) => void;
}

export function LobbyView({ room, currentUser, onRoomUpdate }: LobbyViewProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<'id' | 'url' | 'name' | null>(null);

  // Get real-time presence data
  const { connectedUsers, connectedSpectators, setPresence } = usePresence(room.id, currentUser.id);

  const isHost = room.hostId === currentUser.id;
  const currentPlayer = room.gameState.players.find((p: Player) => p.id === currentUser.id);
  const isPlayer = !!currentPlayer;
  const activePlayers = room.gameState.players.filter((p: Player) => !p.isEliminated);
  const canStart = activePlayers.length >= 2 && isHost;

  // Set presence when component mounts
  useEffect(() => {
    const role = isPlayer ? 'player' : 'spectator';
    setPresence({
      name: currentUser.name,
      role,
      userId: currentUser.id,
    });
  }, [currentUser, isPlayer, setPresence]);

  // Merge player data with real-time presence
  const playersWithPresence = activePlayers.map(player => ({
    ...player,
    isConnected: !!connectedUsers[player.id]
  }));

  // Auto-refresh room data
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/room/${room.id}`);
        const result: ApiResponse<Room> = await response.json();
        
        if (result.success && result.data) {
          onRoomUpdate(result.data);
          
          // If game started, redirect to game view
          if (result.data.gameState.status !== 'lobby') {
            router.refresh();
          }
        }
      } catch (err) {
        console.error('Failed to refresh room:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room.id, onRoomUpdate, router]);

  const handleStartGame = async () => {
    if (!canStart) return;

    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.id,
          hostId: currentUser.id,
        }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to start game');
      }

      // The room will be updated via the auto-refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopySuccess('id');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = room.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('id');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleCopyRoomUrl = async () => {
    const url = `${window.location.origin}/room/${room.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess('url');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('url');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleCopyRoomName = async () => {
    try {
      await navigator.clipboard.writeText(room.name);
      setCopySuccess('name');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = room.name;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('name');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleLeaveRoom = () => {
    SessionManager.clearActiveRoom();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {room.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Waiting for players to join...
            </p>
            
            {/* Room sharing */}
            <div className="mb-6 space-y-3">
              {/* Room ID */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 min-w-[280px]">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Room ID:</span>
                  <code className="text-sm font-mono text-gray-900 dark:text-white truncate">{room.id}</code>
                </div>
                <button
                  onClick={handleCopyRoomId}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium min-w-[120px]"
                >
                  {copySuccess === 'id' ? '✓ Copied!' : 'Copy ID'}
                </button>
              </div>
              
              {/* Room URL */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 min-w-[280px]">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Room URL:</span>
                  <code className="text-sm font-mono text-gray-900 dark:text-white truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/room/${room.id}`.slice(0, 30) + '...' : ''}
                  </code>
                </div>
                <button
                  onClick={handleCopyRoomUrl}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium min-w-[120px]"
                >
                  {copySuccess === 'url' ? '✓ Copied!' : 'Copy URL'}
                </button>
              </div>
              
              {/* Room Name */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 min-w-[280px]">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Room Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{room.name}</span>
                </div>
                <button
                  onClick={handleCopyRoomName}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium min-w-[120px]"
                >
                  {copySuccess === 'name' ? '✓ Copied!' : 'Copy Name'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Players List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Players ({activePlayers.length}/{room.settings.maxPlayers})
                </h2>
                
                <div className="space-y-3">
                  {playersWithPresence.map((player: Player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </span>
                        {player.id === room.hostId && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                            Host
                          </span>
                        )}
                        {player.id === currentUser.id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${
                          player.isConnected 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`} />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {player.isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show spectators if any */}
                  {connectedSpectators.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Spectators ({connectedSpectators.length})
                      </h3>
                      {connectedSpectators.map((spectator) => (
                        <div
                          key={spectator.userId}
                          className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2"
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-3 bg-blue-500 flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              {spectator.name}
                            </span>
                            {spectator.userId === currentUser.id && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="ml-2 text-sm text-blue-700 dark:text-blue-300">
                              Watching
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Empty slots */}
                  {Array.from({ length: room.settings.maxPlayers - activePlayers.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="flex items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
                    >
                      <div className="w-4 h-4 rounded-full mr-3 bg-gray-300 dark:bg-gray-600" />
                      <span className="text-gray-500 dark:text-gray-400 italic">
                        Waiting for player...
                      </span>
                    </div>
                  ))}
                </div>

                {!isPlayer && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      You are joining as a spectator. You can watch the game but won&apos;t be able to play.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Game Settings & Controls */}
            <div className="space-y-6">
              
              {/* Game Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Game Settings
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Board Size:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {room.settings.boardSize.rows} × {room.settings.boardSize.cols}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Max Players:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {room.settings.maxPlayers}
                    </span>
                  </div>
                  
                  {room.settings.gameTimeLimit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Game Time Limit:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {Math.floor(room.settings.gameTimeLimit / 60)} minutes
                      </span>
                    </div>
                  )}
                  
                  {room.settings.moveTimeLimit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Move Time Limit:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {room.settings.moveTimeLimit} seconds
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Undo Moves:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {room.settings.undoEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Room Type:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {room.settings.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Controls
                </h2>
                
                <div className="space-y-3">
                  {isHost && (
                    <button
                      onClick={handleStartGame}
                      disabled={!canStart || isStarting}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      {isStarting ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Starting Game...
                        </div>
                      ) : (
                        `Start Game ${!canStart ? `(Need ${2 - activePlayers.length} more players)` : ''}`
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Leave Room
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}