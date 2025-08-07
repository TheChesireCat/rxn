'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { db } from '../lib/instant';
import { usePresence } from '../lib/hooks/usePresence';
import { SessionManager } from '../lib/sessionManager';
import type { GameState, Player, Room } from '../types/game';

// Context types
interface GameContextType {
  room: Room | null;
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  makeMove: (row: number, col: number) => Promise<void>;
  undoMove: () => Promise<void>;
  refreshRoom: () => void;
}

interface GameProviderProps {
  children: React.ReactNode;
  roomId: string;
}

// Create context
const GameContext = createContext<GameContextType | null>(null);

// Error boundary component
class GameErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Game Error</h2>
          <p className="text-red-600 mb-4">Something went wrong with the game state.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Game Provider component
export function GameProvider({ children, roomId }: GameProviderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionValidated, setSessionValidated] = useState(false);

  // Get current user session
  const currentUser = SessionManager.getCurrentUser();

  // Query room data with real-time updates
  // Note: We're NOT querying messages here as they're handled separately in GameRoom
  const { data: roomData, isLoading: queryLoading, error: queryError } = db.useQuery({
    rooms: {
      $: { where: { id: roomId } }
    }
  });

  const room = roomData?.rooms?.[0] || null;
  const gameState = room?.gameState || null;

  // Manage presence for the current user
  const { setPresence, clearPresence } = usePresence(roomId, currentUser?.id);

  // Validate user session (especially for claimed users)
  useEffect(() => {
    const validateUserSession = async () => {
      if (!currentUser) {
        setSessionValidated(true);
        return;
      }

      try {
        const validation = await SessionManager.validateClaimedUser();
        
        if (!validation.isValid) {
          if (validation.needsReauth && validation.email) {
            // Set error message prompting re-authentication
            setError(
              `Your session expired. Please sign in again with your username "${currentUser.name}" to continue.`
            );
            console.log('User needs re-authentication:', validation.email);
          } else {
            // Clear invalid auth state
            SessionManager.handleInvalidAuth();
            console.log('Cleared invalid authentication state');
          }
        }
      } catch (err) {
        console.error('Session validation error:', err);
      } finally {
        setSessionValidated(true);
      }
    };

    validateUserSession();
  }, [currentUser]);

  // Update loading state - wait for both query and session validation
  useEffect(() => {
    setIsLoading(queryLoading || !sessionValidated);
  }, [queryLoading, sessionValidated]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      // Clear the active room from session if we can't load it
      SessionManager.clearActiveRoom();
      setError(`Failed to load room: ${queryError.message}`);
    } else {
      setError(null);
    }
  }, [queryError]);

  // Set presence when user and room are available
  useEffect(() => {
    if (currentUser && room && gameState && sessionValidated) {
      // Determine if user is a player or spectator
      const isPlayer = gameState.players.some((p: any) => p.id === currentUser.id);
      const role = isPlayer ? 'player' : 'spectator';

      setPresence({
        name: currentUser.name,
        role,
        userId: currentUser.id,
        // Enhanced presence data for claimed users
        isClaimed: currentUser.isClaimed || false,
        email: currentUser.email,
        claimedAt: currentUser.nameClaimedAt,
      });

      // Cleanup presence on unmount
      return () => {
        clearPresence();
      };
    }
  }, [currentUser, room, gameState, sessionValidated, setPresence, clearPresence]);

  // Make a move
  const makeMove = useCallback(async (row: number, col: number) => {
    if (!roomId) {
      throw new Error('No room ID provided');
    }

    if (!currentUser) {
      throw new Error('No user session found');
    }

    try {
      setError(null);
      const response = await fetch('/api/game/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': currentUser.id,
        },
        body: JSON.stringify({
          roomId,
          row,
          col,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make move');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [roomId, currentUser]);

  // Undo last move
  const undoMove = useCallback(async () => {
    if (!roomId) {
      throw new Error('No room ID provided');
    }

    if (!currentUser) {
      throw new Error('No user session found');
    }

    try {
      setError(null);
      const response = await fetch('/api/game/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': currentUser.id,
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to undo move');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [roomId, currentUser]);

  // Refresh room data
  const refreshRoom = useCallback(() => {
    // InstantDB automatically refreshes, but we can clear errors
    setError(null);
  }, []);

  const contextValue: GameContextType = {
    room,
    gameState,
    isLoading,
    error,
    makeMove,
    undoMove,
    refreshRoom,
  };

  return (
    <GameErrorBoundary onError={(error) => setError(error.message)}>
      <GameContext.Provider value={contextValue}>
        {children}
      </GameContext.Provider>
    </GameErrorBoundary>
  );
}

// Hook to use game context
export function useGameContext(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}