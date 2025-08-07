'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModalBase } from './ModalBase';
import { Users, Copy, Check, Play, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Room, Player } from '@/types/game';
import { SessionManager } from '@/lib/sessionManager';

interface LobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  players: Player[];
  currentUserId: string;
  onlineUsers: Set<string>;
  onStartGame: () => Promise<void>;
}

export function LobbyModal({
  isOpen,
  onClose,
  room,
  players,
  currentUserId,
  onlineUsers,
  onStartGame
}: LobbyModalProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = currentUserId === room.hostId;
  const activePlayers = players.filter(p => !p.isEliminated);
  const canStart = activePlayers.length >= 2 && isHost;

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;
    
    setIsStarting(true);
    setError(null);
    
    try {
      await onStartGame();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = () => {
    SessionManager.clearActiveRoom();
    router.push('/');
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Game Lobby"
      position="center"
      size="lg"
      closeOnBackdrop={false}
    >
      <div className="p-6 space-y-6">
        {/* Room Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {room.name}
            </h3>
            <button
              onClick={handleCopyRoomId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-colors"
            >
              <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                {room.id.slice(0, 8)}...
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Waiting for players to join...
          </div>
        </div>

        {/* Players List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Players ({activePlayers.length}/{room.maxPlayers})
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>{onlineUsers.size} online</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {activePlayers.map((player) => {
              const isOnline = onlineUsers.has(player.userId);
              const isYou = player.userId === currentUserId;
              const isPlayerHost = player.userId === room.hostId;
              
              return (
                <div
                  key={player.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border
                    ${isYou ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full shadow-inner"
                      style={{ backgroundColor: player.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </span>
                        {isPlayerHost && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded">
                            Host
                          </span>
                        )}
                        {isYou && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              );
            })}
            
            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - activePlayers.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 mr-3" />
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Waiting for player...
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Settings Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <SettingsIcon className="w-4 h-4" />
            Game Settings
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Grid:</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {room.gridSize}×{room.gridSize}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {room.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
            {room.moveTimeLimit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Move Timer:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {room.moveTimeLimit}s
                </span>
              </div>
            )}
            {room.gameTimeLimit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Game Timer:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {Math.floor(room.gameTimeLimit / 60)}m
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart || isStarting}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
                ${canStart 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transform hover:scale-105' 
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}
              `}
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>
                    {canStart ? 'Start Game' : `Need ${2 - activePlayers.length} more`}
                  </span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
