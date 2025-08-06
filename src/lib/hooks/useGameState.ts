'use client';

import { useMemo } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import type { Player, Cell } from '../../types/game';

// Derived state interface
interface DerivedGameState {
  // Basic game info
  isGameActive: boolean;
  isGameFinished: boolean;
  isInLobby: boolean;
  isRunaway: boolean;
  
  // Current player info
  currentPlayer: Player | null;
  isCurrentPlayerTurn: (playerId: string) => boolean;
  
  // Player utilities
  activePlayers: Player[];
  eliminatedPlayers: Player[];
  connectedPlayers: Player[];
  disconnectedPlayers: Player[];
  
  // Grid utilities
  getCellAt: (row: number, col: number) => Cell | null;
  isCellClickable: (row: number, col: number, playerId: string) => boolean;
  getTotalOrbs: () => number;
  getPlayerOrbCount: (playerId: string) => number;
  
  // Game state checks
  canUndo: boolean;
  canMakeMove: (playerId: string) => boolean;
  
  // Timer info
  turnTimeRemaining: number | null;
  gameTimeRemaining: number | null;
}

/**
 * Hook for accessing game state with derived utilities
 * Provides computed values and helper functions for game logic
 */
export function useGameState(): DerivedGameState {
  const { room, gameState, isLoading } = useGameContext();

  return useMemo(() => {
    // Default values when no game state
    if (!gameState || isLoading) {
      return {
        isGameActive: false,
        isGameFinished: false,
        isInLobby: true,
        isRunaway: false,
        currentPlayer: null,
        isCurrentPlayerTurn: () => false,
        activePlayers: [],
        eliminatedPlayers: [],
        connectedPlayers: [],
        disconnectedPlayers: [],
        getCellAt: () => null,
        isCellClickable: () => false,
        getTotalOrbs: () => 0,
        getPlayerOrbCount: () => 0,
        canUndo: false,
        canMakeMove: () => false,
        turnTimeRemaining: null,
        gameTimeRemaining: null,
      };
    }

    // Game status checks
    const isGameActive = gameState.status === 'active';
    const isGameFinished = gameState.status === 'finished';
    const isInLobby = gameState.status === 'lobby';
    const isRunaway = gameState.status === 'runaway';

    // Current player
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId) || null;

    // Player categorization
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const eliminatedPlayers = gameState.players.filter(p => p.isEliminated);
    const connectedPlayers = gameState.players.filter(p => p.isConnected);
    const disconnectedPlayers = gameState.players.filter(p => !p.isConnected);

    // Grid utilities
    const getCellAt = (row: number, col: number): Cell | null => {
      if (row < 0 || row >= gameState.grid.length || col < 0 || col >= gameState.grid[0].length) {
        return null;
      }
      return gameState.grid[row][col];
    };

    const isCellClickable = (row: number, col: number, playerId: string): boolean => {
      if (!isGameActive || gameState.currentPlayerId !== playerId) {
        return false;
      }

      const cell = getCellAt(row, col);
      if (!cell) {
        return false;
      }

      // Can click empty cells or cells owned by current player
      return !cell.ownerId || cell.ownerId === playerId;
    };

    const getTotalOrbs = (): number => {
      return gameState.grid.reduce((total, row) => {
        return total + row.reduce((rowTotal, cell) => rowTotal + cell.orbs, 0);
      }, 0);
    };

    const getPlayerOrbCount = (playerId: string): number => {
      const player = gameState.players.find(p => p.id === playerId);
      return player?.orbCount || 0;
    };

    // Game action checks
    const canUndo = !!(room?.settings.undoEnabled && 
                      gameState.moveCount > 0 && 
                      isGameActive &&
                      room.history.length > 0);

    const canMakeMove = (playerId: string): boolean => {
      return isGameActive && 
             gameState.currentPlayerId === playerId && 
             !gameState.players.find(p => p.id === playerId)?.isEliminated;
    };

    // Timer calculations
    const now = Date.now();
    const turnTimeRemaining = room?.settings.moveTimeLimit 
      ? Math.max(0, room.settings.moveTimeLimit - (now - gameState.turnStartedAt))
      : null;

    const gameTimeRemaining = room?.settings.gameTimeLimit 
      ? Math.max(0, room.settings.gameTimeLimit - (now - room.createdAt))
      : null;

    // Helper functions
    const isCurrentPlayerTurn = (playerId: string): boolean => {
      return gameState.currentPlayerId === playerId;
    };

    return {
      isGameActive,
      isGameFinished,
      isInLobby,
      isRunaway,
      currentPlayer,
      isCurrentPlayerTurn,
      activePlayers,
      eliminatedPlayers,
      connectedPlayers,
      disconnectedPlayers,
      getCellAt,
      isCellClickable,
      getTotalOrbs,
      getPlayerOrbCount,
      canUndo,
      canMakeMove,
      turnTimeRemaining,
      gameTimeRemaining,
    };
  }, [gameState, room, isLoading]);
}

/**
 * Hook for accessing raw game state and room data
 * Use this when you need direct access to the underlying data
 */
export function useRawGameState() {
  const { room, gameState, isLoading, error } = useGameContext();
  
  return {
    room,
    gameState,
    isLoading,
    error,
  };
}