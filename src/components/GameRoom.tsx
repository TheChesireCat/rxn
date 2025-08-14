'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { GameBoard } from './GameBoard';
import { VictoryMessage } from './VictoryMessage';
import { SpectatorView } from './SpectatorView';
import { MinimalTopBar } from './MinimalTopBar';
import { FloatingActionBar } from './FloatingActionBar';
import { PlayersModal } from './PlayersModal';
import { ChatModal } from './ChatModalFixed';
import { handleGameTimeout, handleMoveTimeout } from '@/lib/timeoutUtils';
import { SessionManager } from '@/lib/sessionManager';
import { usePresence } from '@/lib/hooks/usePresence';
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages';
import { db } from '@/lib/instant';
import { Settings, BarChart3, HelpCircle } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { GameControls } from './GameControls';
import { MoveTimer } from './MoveTimer';
import { GameTimer } from './GameTimer';
import { LobbyModal } from './LobbyModal';
import { DebugChat } from './DebugChat';
import { ConnectionNotification } from './ConnectionNotification';
import { useConnectionNotifications } from '@/lib/hooks/useConnectionNotifications';
import { SessionRecoveryModal } from './auth/SessionRecoveryModal';
import type { User } from '@/types/game';

interface GameRoomProps {
  roomId: string;
  currentUserId: string;
}

function GameRoomContent({ currentUserId, roomId }: { currentUserId: string; roomId: string }) {
  const router = useRouter();
  const { room, gameState, isLoading, error, makeMove, undoMove, refreshRoom } = useGameContext();

  // Display state for delayed victory - starts with real game state
  const [displayGameState, setDisplayGameState] = useState(gameState);

  // Track game version to force GameBoard remount on new games
  const [gameVersion, setGameVersion] = useState(0);

  // Update display state when game state changes (fallback for non-animated changes)
  // Only sync if GameBoard isn't managing the timing (no lastMove = no animations)
  useEffect(() => {
    if (!gameState.lastMove) {
      setDisplayGameState(gameState);
    }
  }, [gameState]);

  // Detect new game and force GameBoard remount
  useEffect(() => {
    // Detect new game (moveCount reset to 0 and status is active)
    if (gameState.moveCount === 0 && gameState.status === 'active') {
      setGameVersion(v => v + 1);
      setDisplayGameState(gameState); // Force reset display state
    }
  }, [gameState.moveCount, gameState.status]);

  // Modal states - ALL useState hooks at the top
  const [showPlayers, setShowPlayers] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState<{ username: string; email?: string } | null>(null);

  // Presence tracking - always call the hook
  const presence = usePresence(room?.id || '', currentUserId);
  const onlineUsers = new Set(Object.keys(presence.connectedUsers));

  // Unread messages tracking
  const { unreadCount: unreadMessages } = useUnreadMessages({
    roomId: room?.id,
    currentUserId,
    isChatOpen: showChat
  });

  // Connection notifications
  const { notifications, dismissNotification } = useConnectionNotifications({
    connectedUsers: presence.connectedUsers,
    players: gameState?.players || [],
    currentUserId
  });

  // Note: ChatModal now handles its own message fetching directly
  // This ensures messages are loaded properly when the modal is opened

  // ALL useEffect hooks MUST be called before any conditional returns

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set presence when room is available
  useEffect(() => {
    if (room && gameState) {
      const currentPlayer = gameState.players.find(p => p.id === currentUserId);
      const role = currentPlayer ? 'player' : 'spectator';
      const userName = currentPlayer?.name || 'Spectator';

      presence.setPresence({
        userId: currentUserId,
        name: userName,
        role: role as 'player' | 'spectator'
      });
    }
  }, [room?.id, currentUserId, presence.setPresence, gameState]);

  // Show lobby modal when game is waiting - MUST be before conditional returns
  const isWaiting = room?.status === 'waiting';

  useEffect(() => {
    if (isWaiting && !showLobby) {
      setShowLobby(true);
    } else if (!isWaiting && showLobby) {
      setShowLobby(false);
    }
  }, [isWaiting, showLobby]);

  // Check for session expiration errors and offer recovery
  useEffect(() => {
    if (error && currentUserId) {
      // Find current user from SessionManager
      const currentUser = SessionManager.getCurrentUser();

      if (currentUser?.isClaimed &&
        (error.includes('session expired') ||
          error.includes('authentication') ||
          error.includes('expired'))) {

        // Set up recovery modal
        setRecoveryUser({
          username: currentUser.name,
          email: currentUser.email
        });
        setShowSessionRecovery(true);
      }
    }
  }, [error, currentUserId]);

  // Compute derived state
  const isSpectator = gameState ? !gameState.players.some(p => p.id === currentUserId) : false;
  const currentPlayer = gameState?.players.find(p => p.id === gameState.currentPlayerId);
  const isGameActive = gameState?.status === 'active';

  // Define callbacks - these don't violate hooks rules
  const onGameTimeout = async () => {
    if (room?.id) {
      try {
        await handleGameTimeout(room.id);
        // Refresh room data after timeout to get updated game state
        await refreshRoom();
      } catch (error) {
        console.error('Game timeout handling failed:', error);
        // Don't break the UI, just log the error
      }
    }
  };

  const onMoveTimeout = async () => {
    if (room?.id) {
      try {
        await handleMoveTimeout(room.id);
        // Refresh room data after timeout to get updated game state
        await refreshRoom();
      } catch (error) {
        console.error('Move timeout handling failed:', error);
        // Don't break the UI, just log the error
      }
    }
  };

  // Note: sendMessage is now handled directly in ChatModal

  const handleStartGame = async () => {
    if (!room) return;

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          userId: currentUserId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      setShowLobby(false);
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  };

  const handleSessionRecovered = (user: User) => {
    setShowSessionRecovery(false);
    setRecoveryUser(null);
    // Clear the error that triggered recovery
    refreshRoom();
    // Force a page refresh to update the user context
    window.location.reload();
  };

  const handleSessionRecoveryClose = () => {
    setShowSessionRecovery(false);
    setRecoveryUser(null);
    // User chose to continue as guest, error will remain visible
  };

  // NOW we can have conditional returns, after ALL hooks have been called

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState || !room) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md w-full">
          <div className="mb-4">
            <div className="text-4xl mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="inline-block text-yellow-600 dark:text-yellow-400"
              >
                <path
                  fill="currentColor"
                  d="M22 14h-1c0-3.87-3.13-7-7-7h-1V5.73A2 2 0 1 0 10 4c0 .74.4 1.39 1 1.73V7h-1c-3.87 0-7 3.13-7 7H2c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h1v1a2 2 0 0 0 2 2h14c1.11 0 2-.89 2-2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1M9.86 16.68l-1.18 1.18l-1.18-1.18l-1.18 1.18l-1.18-1.18l1.18-1.18l-1.18-1.18l1.18-1.18l1.18 1.18l1.18-1.18l1.18 1.18l-1.18 1.18zm9 0l-1.18 1.18l-1.18-1.18l-1.18 1.18l-1.18-1.18l1.18-1.18l-1.18-1.18l1.18-1.18l1.18 1.18l1.18-1.18l1.18 1.18l-1.18 1.18z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Game Not Found
            </h2>
            <p className="text-yellow-600 dark:text-yellow-400 mb-2">
              {error || 'The game room could not be loaded.'}
            </p>
          </div>
          <button
            onClick={() => {
              SessionManager.clearActiveRoom();
              router.push('/');
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Spectator view
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

  // Main game view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Minimal Top Bar */}
      <MinimalTopBar
        room={room}
        currentPlayer={currentPlayer}
        roomId={room.id}
        showMenu={false}
      />

      {/* Main Game Area - centered and clean */}
      <div className="pt-16 pb-24 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-7xl">
          {/* Victory message - overlaid when game ends (uses display state for proper timing) */}
          {displayGameState.winner && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
              <VictoryMessage
                gameState={displayGameState}
                currentUserId={currentUserId}
                room={room}
              />
            </div>
          )}

          {/* Game Board - the star of the show */}
          <GameBoard
            key={`game-${gameVersion}`} // Force remount on new games
            gameState={gameState}
            currentUserId={currentUserId}
            roomId={room.id}
            onMove={makeMove}
            disabled={!isGameActive}
            onDisplayStateChange={setDisplayGameState}
          />

          {/* Move Timer - prominently displayed during gameplay */}
          {room.settings.moveTimeLimit && isGameActive && (
            <div className="mt-4 max-w-sm mx-auto">
              <MoveTimer
                turnStartedAt={gameState.turnStartedAt || Date.now()}
                moveTimeLimit={room.settings.moveTimeLimit}
                isCurrentPlayerTurn={gameState.currentPlayerId === currentUserId}
                isGameActive={isGameActive}
                onTimeout={onMoveTimeout}
              />
            </div>
          )}
        </div>
      </div>

      {/* Connection Notifications */}
      {notifications.map((notification) => (
        <ConnectionNotification
          key={notification.id}
          playerName={notification.playerName}
          isOnline={notification.isOnline}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}

      {/* Debug panel - remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <DebugChat roomId={room.id} currentUserId={currentUserId} />
      )} */}

      {/* Floating Action Buttons */}
      <FloatingActionBar
        onPlayersClick={() => setShowPlayers(true)}
        onChatClick={() => setShowChat(true)}
        onSettingsClick={() => setShowSettings(true)}
        onStatsClick={() => setShowStats(true)}
        onHelpClick={() => setShowHelp(true)}
        playerCount={gameState.players.length}
        unreadMessages={unreadMessages}
        isGameActive={isGameActive}
        isMobile={isMobile}
      />

      {/* Modals */}
      <LobbyModal
        isOpen={showLobby && isWaiting}
        onClose={() => isWaiting ? null : setShowLobby(false)}
        room={room}
        players={gameState.players}
        currentUserId={currentUserId}
        onlineUsers={onlineUsers}
        onStartGame={handleStartGame}
      />

      <PlayersModal
        isOpen={showPlayers}
        onClose={() => setShowPlayers(false)}
        room={room}
        players={gameState.players}
        currentUserId={currentUserId}
        currentPlayerId={gameState.currentPlayerId}
        onlineUsers={onlineUsers}
      />

      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        roomId={room?.id}
        currentUserId={currentUserId}
        disabled={!room || room.status === 'finished'}
        players={gameState.players}  // Pass players for username lookup
      />

      {/* Session Recovery Modal */}
      {recoveryUser && (
        <SessionRecoveryModal
          isOpen={showSessionRecovery}
          onClose={handleSessionRecoveryClose}
          username={recoveryUser.username}
          email={recoveryUser.email}
          onRecovered={handleSessionRecovered}
        />
      )}

      {/* Settings Modal */}
      <ModalBase
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Game Settings"
        position="center"
      >
        <div className="p-4 space-y-4">
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



          {room.settings.gameTimeLimit && isGameActive && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Game Timer
              </h3>
              <GameTimer
                gameTimeLimit={room.settings.gameTimeLimit}
                gameStartTime={room.createdAt}
                onTimeout={onGameTimeout}
              />
            </div>
          )}
        </div>
      </ModalBase>

      {/* Stats Modal */}
      <ModalBase
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        title="Game Statistics"
        position="center"
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Moves</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gameState.moveCount}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Players</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gameState.players.filter(p => !p.isEliminated).length}
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Player Statistics
            </h3>
            <div className="space-y-2">
              {gameState.players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-sm font-medium">{player.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {player.orbCount} orbs
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalBase>

      {/* Help Modal */}
      <ModalBase
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Play"
        position="center"
      >
        <div className="p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold mb-2">Objective</h3>
            <p>Be the last player with orbs on the board!</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">How to Play</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click on any cell you own or an empty cell to place an orb</li>
              <li>Cells explode when they reach critical mass:</li>
              <ul className="ml-6 mt-1 space-y-1">
                <li>• Corner cells: 2 orbs</li>
                <li>• Edge cells: 3 orbs</li>
                <li>• Center cells: 4 orbs</li>
              </ul>
              <li>Explosions spread orbs to adjacent cells</li>
              <li>Captured cells become your color</li>
              <li>Chain reactions can eliminate opponents!</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Control corners for strategic advantage</li>
              <li>Build up orbs near opponent cells</li>
              <li>Watch for chain reaction opportunities</li>
            </ul>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}

export function GameRoom({ roomId, currentUserId }: GameRoomProps) {
  return (
    <GameProvider roomId={roomId}>
      <GameRoomContent currentUserId={currentUserId} roomId={roomId} />
    </GameProvider>
  );
}
