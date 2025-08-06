import { describe, it, expect } from 'vitest';
import { processMove, createEmptyGrid } from '../gameLogic';
import { GameState } from '@/types/game';

describe('Win/Loss Integration Tests', () => {
  it('should handle complete game flow from start to win', () => {
    // Create a simple 2x2 game with 2 players
    const initialGameState: GameState = {
      grid: createEmptyGrid(2, 2),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'active',
    };

    // Player 1 makes first move
    const move1 = processMove(initialGameState, 'p1', 0, 0);
    expect(move1.success).toBe(true);
    expect(move1.newGameState?.currentPlayerId).toBe('p2');
    expect(move1.newGameState?.status).toBe('active');

    // Player 2 makes move
    const move2 = processMove(move1.newGameState!, 'p2', 0, 1);
    expect(move2.success).toBe(true);
    expect(move2.newGameState?.currentPlayerId).toBe('p1');

    // Player 1 makes another move
    const move3 = processMove(move2.newGameState!, 'p1', 1, 0);
    expect(move3.success).toBe(true);

    // Player 2 makes another move
    const move4 = processMove(move3.newGameState!, 'p2', 1, 1);
    expect(move4.success).toBe(true);

    // Player 1 makes move that should trigger explosion and potentially win
    const move5 = processMove(move4.newGameState!, 'p1', 0, 0);
    expect(move5.success).toBe(true);

    // Check if game ended or continues
    const finalState = move5.newGameState!;
    if (finalState.status === 'finished') {
      expect(finalState.winner).toBeDefined();
      expect(finalState.players.filter(p => !p.isEliminated)).toHaveLength(1);
    }
  });

  it('should prevent moves from eliminated players', () => {
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

  it('should prevent moves in finished games', () => {
    const gameState: GameState = {
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

    const result = processMove(gameState, 'p1', 0, 0);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Game has finished');
  });

  it('should prevent moves in runaway games', () => {
    const gameState: GameState = {
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

    const result = processMove(gameState, 'p1', 0, 0);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Game ended due to runaway chain reaction');
  });

  it('should handle player elimination correctly', () => {
    // Create a game state where player 2 has no orbs and game has progressed
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

    // Process a move that should trigger elimination check
    const result = processMove(gameState, 'p1', 0, 0);
    expect(result.success).toBe(true);
    
    const newState = result.newGameState!;
    
    // Player 2 should be eliminated
    const player2 = newState.players.find(p => p.id === 'p2');
    expect(player2?.isEliminated).toBe(true);
    
    // Game should be finished with player 1 as winner
    expect(newState.status).toBe('finished');
    expect(newState.winner).toBe('p1');
  });
});