'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { GameBoard } from './GameBoard';
import { PlayerList } from './PlayerList';
import { TurnIndicator } from './TurnIndicator';
import { VictoryMessage } from './VictoryMessage';
import { GameTimer } from './GameTimer';
import { MoveTimer } from './MoveTimer';
import { ChatPanel } from './ChatPanel';

interface SpectatorViewProps {
  gameState: GameState;
  roomId: string;
  roomName: string;
  currentUserId: string;
  gameStartTime: number;
  roomSettings: {
    gameTimeLimit?: number;
    moveTimeLimit?: number;
  };
}

export function SpectatorView({
  gameState,
  roomId,
  roomName,
  currentUserId,
  gameStartTime,
  roomSettings,
}: SpectatorViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            
            {/* Header section with spectator indicator */}
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {roomName}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">Spectating</span>
                </div>
                <span>•</span>
                <span>Room ID: {roomId}</span>
              </div>
            </div>

            {/* Victory message - shown when game is finished */}
            {(gameState.status === 'finished' || gameState.status === 'runaway') && (
              <VictoryMessage 
                gameState={gameState} 
                currentUserId={currentUserId}
                className="mb-4"
              />
            )}

            {/* Turn indicator - prominent on mobile */}
            {gameState.status === 'active' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <TurnIndicator 
                  gameState={gameState} 
                  currentUserId={currentUserId}
                />
              </div>
            )}

            {/* Desktop layout: Three-column layout */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-6 space-y-4 lg:space-y-0">
              
              {/* Left sidebar - Player list and game info */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <PlayerList
                    players={gameState.players}
                    currentPlayerId={gameState.currentPlayerId}
                    currentUserId={currentUserId}
                    roomId={roomId}
                  />
                </div>

                {/* Game timers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Game Info
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Game timer */}
                    {roomSettings.gameTimeLimit && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Game Time
                        </label>
                        <GameTimer
                          gameStartTime={gameStartTime}
                          gameTimeLimit={roomSettings.gameTimeLimit}
                          isGameActive={gameState.status === 'active'}
                          onTimeout={() => {}} // Spectators don't handle timeouts
                        />
                      </div>
                    )}

                    {/* Move timer */}
                    {roomSettings.moveTimeLimit && gameState.status === 'active' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Turn
                        </label>
                        <MoveTimer
                          turnStartedAt={gameState.turnStartedAt}
                          moveTimeLimit={roomSettings.moveTimeLimit}
                          isCurrentPlayerTurn={false}
                          isGameActive={gameState.status === 'active'}
                          onTimeout={() => {}} // Spectators don't handle timeouts
                        />
                      </div>
                    )}

                    {/* Game stats */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Moves:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {gameState.moveCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white capitalize">
                            {gameState.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spectator notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Spectator Mode
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        You&apos;re watching this game. All moves and updates will appear in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content - Read-only game board */}
              <div className="lg:col-span-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <GameBoard
                    gameState={gameState}
                    currentUserId={currentUserId}
                    roomId={roomId}
                    disabled={true} // Always disabled for spectators
                  />
                </div>
              </div>

              {/* Right sidebar - Chat panel */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96 lg:h-[600px]">
                  <ChatPanel
                    roomId={roomId}
                    currentUserId={currentUserId}
                    currentUserName="Spectator"
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