'use client';

import React from 'react';
import { ModalBase } from './ModalBase';
import { User, Crown, Eye, Circle, Clock } from 'lucide-react';
import { Room, Player } from '@/types/game';

interface PlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  players: Player[];
  currentUserId: string;
  currentPlayerId?: string;
  onlineUsers: Set<string>;
}

export function PlayersModal({
  isOpen,
  onClose,
  room,
  players,
  currentUserId,
  currentPlayerId,
  onlineUsers
}: PlayersModalProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentUserId === room.hostId;

  const sortedPlayers = [...players].sort((a, b) => {
    // Host first
    if (a.userId === room.hostId) return -1;
    if (b.userId === room.hostId) return 1;
    // Then by join order
    return 0;
  });

  const spectators = Array.from(onlineUsers).filter(
    userId => !players.some(p => p.id === userId)
  );

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Players"
      position="right"
      size="sm"
    >
      <div className="p-4 space-y-4">
        {/* Current Turn Indicator */}
        {room.status === 'playing' && currentPlayer && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">Current Turn:</span>
              <span className="font-semibold" style={{ color: currentPlayer.color }}>
                {currentPlayer.name}
              </span>
            </div>
          </div>
        )}

        {/* Players List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Players ({players.length}/{room.maxPlayers})
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player) => {
              const isOnline = onlineUsers.has(player.id);
              const isCurrentTurn = player.id === currentPlayerId;
              const isEliminated = room.status === 'playing' && player.orbCount === 0 && player.hasPlayed;

              return (
                <div
                  key={player.id}
                  className={`
                    p-3 rounded-lg border transition-all duration-200
                    ${isCurrentTurn ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
                    ${isEliminated ? 'opacity-50' : ''}
                    ${!isOnline ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Player Color Indicator */}
                      <div
                        className="w-8 h-8 rounded-full shadow-inner"
                        style={{ backgroundColor: player.color }}
                      />
                      
                      {/* Player Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.name}
                          </span>
                          {player.id === room.hostId && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          {player.id === currentUserId && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">(You)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Circle className={`w-2 h-2 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                          <span>{isOnline ? 'Online' : 'Offline'}</span>
                          {room.status === 'playing' && (
                            <>
                              <span>•</span>
                              <span>{player.orbCount} orbs</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Turn Indicator */}
                    {isCurrentTurn && !isEliminated && (
                      <div className="animate-pulse">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                      </div>
                    )}

                    {/* Eliminated Badge */}
                    {isEliminated && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Eliminated
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spectators */}
        {spectators.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Spectators ({spectators.length})
            </h3>
            <div className="space-y-1">
              {spectators.map((userId) => (
                <div
                  key={userId}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Spectator
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Room Status:</span>
              <span className="font-medium capitalize">{room.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Grid Size:</span>
              <span className="font-medium">{room.gridSize}×{room.gridSize}</span>
            </div>
            {room.moveTimeLimit && (
              <div className="flex justify-between">
                <span>Move Timer:</span>
                <span className="font-medium">{room.moveTimeLimit}s</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
