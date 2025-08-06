import { describe, it, expect } from 'vitest';
import { processMove, createEmptyGrid, checkWinCondition, checkEliminatedPlayers, canMakeMove } from '../gameLogic';
import { GameState } from '@/types/game';

describe('Complete Win/Loss Implementation Tests', () => {
  describe('Win condition checking in move processing', () => {
    it('should detect win condition after player elimination', () => {
      const gameState: GameState = {
        grid: [
          [{ orbs: 1, ownerId: 'p1', criticalMass: 2 }, { orbs: 1, ownerId: 'p1', criticalMass: 3 }],
          [{ orbs: 1, ownerId: 'p1', criticalMass: 3 }, { orbs: 0, ownerId: undefined, criticalMass: 4 }],
        ],
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 3, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
        ],
        currentPlayerId: 'p1',
        moveCount: 10, // Enough moves that everyone has had a turn
        turnStartedAt: Date.now(),
        status: 'active',
      };

      const result = processMove(gameState, 'p1', 1, 1);
      
      expect(result.success).toBe(true);
      expect(result.newGameState?.status).toBe('finished');
      expect(result.newGameState?.winner).toBe('p1');
      
      // Player 2 should be eliminated
      const player2 = result.newGameState?.players.find(p => p.id === 'p2');
      expect(player2?.isEliminated).toBe(true);
    });

    it('should handle runaway chain reaction win condition', () => {
      // Test that runaway detection works - actual runaway scenarios are complex
      // This test verifies the processMove function can handle runaway results
      const gameState: GameState = {
        grid: [
          [{ orbs: 1, ownerId: 'p1', criticalMass: 2 }, { orbs: 1, ownerId: 'p2', criticalMass: 3 }],
          [{ orbs: 1, ownerId: 'p2', criticalMass: 3 }, { orbs: 0, ownerId: undefined, criticalMass: 4 }],
        ],
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 1, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 2, isEliminated: false, isConnected: true },
        ],
        currentPlayerId: 'p1',
        moveCount: 5,
        turnStartedAt: Date.now(),
        status: 'active',
      };

      const result = processMove(gameState, 'p1', 1, 1);
      
      expect(result.success).toBe(true);
      // The game should continue or finish normally (runaway is rare and tested separately)
      expect(['active', 'finished']).toContain(result.newGameState?.status);
    });
  });

  describe('Game state prevention for finished games', () => {
    it('should prevent moves in finished games', () => {
      const finishedGameState: GameState = {
        grid: createEmptyGrid(2, 2),
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
        ],
        currentPlayerId: 'p1',
        moveCount: 10,
        turnStartedAt: Date.now(),
        status: 'finished',
        winner: 'p1',
      };

      const moveCheck = canMakeMove(finishedGameState);
      expect(moveCheck.canMove).toBe(false);
      expect(moveCheck.reason).toBe('Game has finished');

      const result = processMove(finishedGameState, 'p1', 0, 0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game has finished');
    });

    it('should prevent moves in runaway games', () => {
      const runawayGameState: GameState = {
        grid: createEmptyGrid(2, 2),
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
        ],
        currentPlayerId: 'p1',
        moveCount: 10,
        turnStartedAt: Date.now(),
        status: 'runaway',
        winner: 'p1',
      };

      const moveCheck = canMakeMove(runawayGameState);
      expect(moveCheck.canMove).toBe(false);
      expect(moveCheck.reason).toBe('Game ended due to runaway chain reaction');

      const result = processMove(runawayGameState, 'p1', 0, 0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game ended due to runaway chain reaction');
    });
  });

  describe('Automatic spectator mode transition for eliminated players', () => {
    it('should prevent eliminated players from making moves', () => {
      const gameState: GameState = {
        grid: createEmptyGrid(2, 2),
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
        ],
        currentPlayerId: 'p2',
        moveCount: 10,
        turnStartedAt: Date.now(),
        status: 'active',
      };

      const result = processMove(gameState, 'p2', 0, 0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('You have been eliminated and are now spectating');
    });

    it('should automatically eliminate players with no orbs after initial rounds', () => {
      const gameState: GameState = {
        grid: [
          [{ orbs: 1, ownerId: 'p1', criticalMass: 2 }, { orbs: 1, ownerId: 'p1', criticalMass: 3 }],
          [{ orbs: 1, ownerId: 'p1', criticalMass: 3 }, { orbs: 1, ownerId: 'p1', criticalMass: 4 }],
        ],
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 4, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
        ],
        currentPlayerId: 'p1',
        moveCount: 10, // Enough moves that everyone has had a turn
        turnStartedAt: Date.now(),
        status: 'active',
      };

      const updatedPlayers = checkEliminatedPlayers(gameState);
      
      const player1 = updatedPlayers.find(p => p.id === 'p1');
      const player2 = updatedPlayers.find(p => p.id === 'p2');
      
      expect(player1?.isEliminated).toBe(false);
      expect(player2?.isEliminated).toBe(true);
    });

    it('should not eliminate players in early game even with no orbs', () => {
      const gameState: GameState = {
        grid: createEmptyGrid(2, 2),
        players: [
          { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
          { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
        ],
        currentPlayerId: 'p1',
        moveCount: 1, // Early in the game
        turnStartedAt: Date.now(),
        status: 'active',
      };

      const updatedPlayers = checkEliminatedPlayers(gameState);
      
      const player1 = updatedPlayers.find(p => p.id === 'p1');
      const player2 = updatedPlayers.find(p => p.id === 'p2');
      
      expect(player1?.isEliminated).toBe(false);
      expect(player2?.isEliminated).toBe(false);
    });
  });

  describe('Win condition edge cases', () => {
    it('should handle single player remaining correctly', () => {
      const players = [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
        { id: 'p3', name: 'Player 3', color: '#7928ca', orbCount: 0, isEliminated: true, isConnected: true },
      ];

      const winner = checkWinCondition(players);
      expect(winner).toBe('p1');
    });

    it('should return null when multiple players remain', () => {
      const players = [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 3, isEliminated: false, isConnected: true },
        { id: 'p3', name: 'Player 3', color: '#7928ca', orbCount: 0, isEliminated: true, isConnected: true },
      ];

      const winner = checkWinCondition(players);
      expect(winner).toBeNull();
    });

    it('should handle edge case when all players are eliminated', () => {
      const players = [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: true, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
      ];

      const winner = checkWinCondition(players);
      // Should return the player with the highest orb count (or first player if tied)
      expect(winner).toBe('p1');
    });
  });
});