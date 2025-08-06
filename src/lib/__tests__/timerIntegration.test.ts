import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkTimeouts, handleMoveTimeout } from '../gameLogic';
import { GameState, RoomSettings } from '@/types/game';

describe('Timer Integration Tests', () => {
  const mockGameState: GameState = {
    grid: [
      [{ orbs: 1, ownerId: 'player1', criticalMass: 2 }],
    ],
    players: [
      {
        id: 'player1',
        name: 'Player 1',
        color: '#0070f3',
        orbCount: 1,
        isEliminated: false,
        isConnected: true,
      },
      {
        id: 'player2',
        name: 'Player 2',
        color: '#f81ce5',
        orbCount: 0,
        isEliminated: false,
        isConnected: true,
      },
    ],
    currentPlayerId: 'player1',
    moveCount: 1,
    turnStartedAt: Date.now() - 35000, // 35 seconds ago
    status: 'active',
  };

  const mockSettings: RoomSettings = {
    maxPlayers: 2,
    boardSize: { rows: 1, cols: 1 },
    gameTimeLimit: 10, // 10 minutes
    moveTimeLimit: 30, // 30 seconds
    undoEnabled: true,
    isPrivate: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Timer Integration', () => {
    it('should detect game timeout and determine winner by orb count', () => {
      const gameStartTime = Date.now() - 11 * 60 * 1000; // 11 minutes ago (past 10 minute limit)
      
      // Use a fresh turn start time to avoid move timeout
      const gameStateWithFreshTurn: GameState = {
        ...mockGameState,
        turnStartedAt: Date.now() - 5000, // 5 seconds ago (within move limit)
      };

      const result = checkTimeouts(gameStateWithFreshTurn, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(true);
      expect(result.isMoveTimeout).toBe(false);
      expect(result.winner).toBe('player1'); // Player 1 has more orbs
    });

    it('should not detect game timeout when within time limit', () => {
      const gameStartTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago (within 10 minute limit)

      const result = checkTimeouts(mockGameState, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(false);
      expect(result.isMoveTimeout).toBe(true); // Move timeout should still be detected
      expect(result.winner).toBeUndefined();
    });

    it('should handle tied orb counts in game timeout', () => {
      const tiedGameState: GameState = {
        ...mockGameState,
        players: [
          { ...mockGameState.players[0], orbCount: 5 },
          { ...mockGameState.players[1], orbCount: 5 }, // Same orb count
        ],
      };

      const gameStartTime = Date.now() - 11 * 60 * 1000; // Past time limit

      const result = checkTimeouts(tiedGameState, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(true);
      // Winner should be the first player found with max orbs (player1)
      expect(result.winner).toBe('player1');
    });
  });

  describe('Move Timer Integration', () => {
    it('should detect move timeout and skip turn', () => {
      const gameStartTime = Date.now() - 5 * 60 * 1000; // Within game time limit

      const result = checkTimeouts(mockGameState, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(false);
      expect(result.isMoveTimeout).toBe(true);
      expect(result.winner).toBeUndefined();
    });

    it('should not detect move timeout when within time limit', () => {
      const recentGameState: GameState = {
        ...mockGameState,
        turnStartedAt: Date.now() - 15000, // 15 seconds ago (within 30 second limit)
      };

      const gameStartTime = Date.now() - 5 * 60 * 1000; // Within game time limit

      const result = checkTimeouts(recentGameState, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(false);
      expect(result.isMoveTimeout).toBe(false);
      expect(result.winner).toBeUndefined();
    });

    it('should handle move timeout by advancing to next player', () => {
      const newGameState = handleMoveTimeout(mockGameState);

      expect(newGameState.currentPlayerId).toBe('player2'); // Should advance to next player
      expect(newGameState.turnStartedAt).toBeGreaterThan(mockGameState.turnStartedAt);
      expect(newGameState.moveCount).toBe(mockGameState.moveCount); // Move count should not change
    });

    it('should wrap around to first player when handling timeout', () => {
      const gameStatePlayer2Turn: GameState = {
        ...mockGameState,
        currentPlayerId: 'player2',
      };

      const newGameState = handleMoveTimeout(gameStatePlayer2Turn);

      expect(newGameState.currentPlayerId).toBe('player1'); // Should wrap to first player
      expect(newGameState.turnStartedAt).toBeGreaterThan(gameStatePlayer2Turn.turnStartedAt);
    });
  });

  describe('Combined Timer Scenarios', () => {
    it('should prioritize game timeout over move timeout', () => {
      const gameStartTime = Date.now() - 11 * 60 * 1000; // Past game time limit
      // Move is also timed out (turnStartedAt is 25 seconds ago, limit is 30)

      const result = checkTimeouts(mockGameState, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(true);
      expect(result.isMoveTimeout).toBe(true);
      expect(result.winner).toBe('player1'); // Game timeout winner should be determined
    });

    it('should handle no time limits gracefully', () => {
      const noLimitSettings: RoomSettings = {
        ...mockSettings,
        gameTimeLimit: undefined,
        moveTimeLimit: undefined,
      };

      const gameStartTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

      const result = checkTimeouts(mockGameState, noLimitSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(false);
      expect(result.isMoveTimeout).toBe(false);
      expect(result.winner).toBeUndefined();
    });

    it('should handle eliminated players in timeout scenarios', () => {
      const gameStateWithEliminated: GameState = {
        ...mockGameState,
        players: [
          { ...mockGameState.players[0], isEliminated: true, orbCount: 0 },
          { ...mockGameState.players[1], orbCount: 5 },
        ],
      };

      const gameStartTime = Date.now() - 11 * 60 * 1000; // Past game time limit

      const result = checkTimeouts(gameStateWithEliminated, mockSettings, gameStartTime);

      expect(result.isGameTimeout).toBe(true);
      expect(result.winner).toBe('player2'); // Only non-eliminated player should win
    });
  });
});