'use client';

import React from 'react';
import { Player } from '@/types/game';
import { usePresence } from '@/lib/hooks/usePresence';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  currentUserId: string;
  roomId: string;
  className?: string;
}

export function PlayerList({ 
  players, 
  currentPlayerId, 
  currentUserId,
  roomId,
  className = '' 
}: PlayerListProps) {
  // Get real-time presence data
  const { connectedUsers, connectedPlayers, connectedSpectators, isLoading: presenceLoading } = usePresence(roomId, currentUserId);

  // Merge player data with presence data
  const playersWithPresence = players.map(player => {
    const presenceData = connectedUsers[player.id];
    return {
      ...player,
      isConnected: !!presenceData,
      role: presenceData?.role || 'player'
    };
  });

  // Separate players and spectators
  const activePlayers = playersWithPresence.filter(p => !p.isEliminated);
  const eliminatedPlayers = playersWithPresence.filter(p => p.isEliminated);
  const spectators = connectedSpectators.filter(spectator => 
    !players.some(player => player.id === spectator.userId)
  );
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Players ({players.length})
        </h2>
        
        {/* Connection status summary */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{connectedPlayers.length} online</span>
          </div>
          {spectators.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>{spectators.length} watching</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Players */}
      {activePlayers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Players
          </h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {activePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                currentPlayerId={currentPlayerId}
                currentUserId={currentUserId}
                isEliminated={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Eliminated Players */}
      {eliminatedPlayers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Eliminated Players
          </h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {eliminatedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                currentPlayerId={currentPlayerId}
                currentUserId={currentUserId}
                isEliminated={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Spectators */}
      {spectators.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Spectators ({spectators.length})
          </h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {spectators.map((spectator) => (
              <SpectatorCard
                key={spectator.userId}
                spectator={spectator}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Summary stats for mobile */}
      <div className="mt-3 sm:hidden">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Active: {activePlayers.length}</span>
          <span>Total Orbs: {players.reduce((sum, p) => sum + p.orbCount, 0)}</span>
        </div>
      </div>

      {/* Loading indicator for presence */}
      {presenceLoading && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Updating presence...
        </div>
      )}
    </div>
  );
}

// Player card component for active and eliminated players
interface PlayerCardProps {
  player: Player & { role?: string };
  currentPlayerId: string;
  currentUserId: string;
  isEliminated: boolean;
}

function PlayerCard({ player, currentPlayerId, currentUserId, isEliminated }: PlayerCardProps) {
  return (
    <div
      className={`
        flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 
        rounded-lg border transition-all duration-200
        ${isEliminated 
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60' 
          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md'
        }
        ${player.id === currentPlayerId && !isEliminated
          ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' 
          : ''
        }
      `}
    >
      {/* Player color indicator */}
      <div
        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0"
        style={{ backgroundColor: player.color }}
        aria-label={`Player color: ${player.color}`}
      />
      
      {/* Connection status indicator */}
      <div className="flex items-center gap-1">
        <div 
          className={`w-2 h-2 rounded-full ${
            player.isConnected 
              ? 'bg-green-500' 
              : 'bg-red-500'
          }`}
          title={player.isConnected ? 'Online' : 'Offline'}
        />
      </div>
      
      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
            {player.name}
            {player.id === currentUserId && (
              <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
            )}
          </span>
          
          {/* Current turn indicator */}
          {player.id === currentPlayerId && !isEliminated && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium hidden sm:inline">
                Turn
              </span>
            </div>
          )}
        </div>
        
        {/* Orb count and status */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {player.orbCount} orbs
          </span>
          
          {/* Status indicators */}
          <div className="flex gap-1">
            {isEliminated && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                Eliminated
              </span>
            )}
            
            {!player.isConnected && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                Offline
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Spectator card component
interface SpectatorCardProps {
  spectator: { name: string; userId: string; role: string };
  currentUserId: string;
}

function SpectatorCard({ spectator, currentUserId }: SpectatorCardProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-all duration-200">
      {/* Spectator icon */}
      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
        </svg>
      </div>
      
      {/* Connection status indicator */}
      <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
      
      {/* Spectator info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base truncate">
            {spectator.name}
            {spectator.userId === currentUserId && (
              <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
            )}
          </span>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            Spectator
          </span>
        </div>
      </div>
    </div>
  );
}