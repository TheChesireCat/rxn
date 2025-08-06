'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { GameBoard } from './GameBoard';
import { PlayerList } from './PlayerList';
import { TurnIndicator } from './TurnIndicator';
import { GameControls } from './GameControls';
import { VictoryMessage } from './VictoryMessage';
import { SpectatorView } from './SpectatorView';
import { ChatPanel } from './ChatPanel';
import { handleGameTimeout, handleMoveTimeout } from '@/lib/timeoutUtils';
import { SessionManager } from '@/lib/sessionManager';

interface GameRoomProps {
  roomId: string;
  currentUserId: string;
}

function GameRoomContent({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const { room, gameState, isLoading, error, makeMove, undoMove, refreshRoom } = useGameContext();

  // Check if current user is a spectator
  const isSpectator = gameState ? !gameState.players.some(p => p.id === currentUserId) : false;

  // Timeout handlers
  const onGameTimeout = async () => {
    if (room?.id) {
      await handleGameTimeout(room.id);
    }
  };

  const onMoveTimeout = async () => {
    if (room?.id) {
      await handleMoveTimeout(room.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-w-md w-full">
          <h2 className="text-lg sm:text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Error Loading Game
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!gameState || !room) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md w-full">
          <div className="mb-4">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Game Not Found
            </h2>
            <p className="text-yellow-600 dark:text-yellow-400 text-sm sm:text-base mb-2">
              The game room could not be loaded.
            </p>
            <p className="text-yellow-500 dark:text-yellow-500 text-xs">
              The room may have been deleted by the host or no longer exists.
            </p>
          </div>
          <button
            onClick={() => {
              SessionManager.clearActiveRoom();
              router.push('/');
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
          >
            <span>🏠</span>
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  // Render spectator view if user is not a player
  if (isSpectator) {
    return (
      <SpectatorView
        gameState={gameState}
        roomId={room.id}
        roomName={room.name}
        currentUserId={currentUserId}
        gameStartTime={room.createdAt}
        roomSettings={room.settings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-first layout */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Header section - Room name and basic info */}
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {room.name}
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Room ID: {room.id}
              </div>
            </div>

            {/* Victory message - shown when game is finished */}
            {(gameState.status === 'finished' || gameState.status === 'runaway') && (
              <VictoryMessage 
                gameState={gameState} 
                currentUserId={currentUserId}
                room={room}
                className="mb-4"
              />
            )}

            {/* Turn indicator - prominent on mobile */}
            {gameState.status === 'active' && (
              <TurnIndicator 
                gameState={gameState} 
                currentUserId={currentUserId}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              />
            )}

            {/* Desktop layout: Three-column layout */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-6 space-y-4 lg:space-y-0">
              
              {/* Left sidebar - Player list and controls */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <PlayerList
                    players={gameState.players}
                    currentPlayerId={gameState.currentPlayerId}
                    currentUserId={currentUserId}
                    roomId={room.id}
                  />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <GameControls
                    gameState={gameState}
                    roomSettings={room.settings}
                    currentUserId={currentUserId}
                    gameStartTime={room.createdAt}
                    onUndo={undoMove}
                    onRefresh={refreshRoom}
                    onGameTimeout={onGameTimeout}
                    onMoveTimeout={onMoveTimeout}
                  />
                </div>
              </div>

              {/* Main content - Game board */}
              <div className="lg:col-span-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <GameBoard
                    gameState={gameState}
                    currentUserId={currentUserId}
                    roomId={room.id}
                    onMove={makeMove}
                  />
                </div>
              </div>

              {/* Right sidebar - Chat panel */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96 lg:h-[600px]">
                  <ChatPanel
                    roomId={room.id}
                    currentUserId={currentUserId}
                    currentUserName={gameState.players.find(p => p.id === currentUserId)?.name || 'Unknown'}
                    players={gameState.players}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GameRoom({ roomId, currentUserId }: GameRoomProps) {
  return (
    <GameProvider roomId={roomId}>
      <GameRoomContent currentUserId={currentUserId} />
    </GameProvider>
  );
}