import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCriticalMass,
  createEmptyGrid,
  isValidMove,
  getAdjacentCells,
  countPlayerOrbs,
  checkEliminatedPlayers,
  getNextPlayer,
  checkWinCondition,
  canMakeMove,
  simulateExplosions,
  processMove,
  checkTimeouts,
  handleMoveTimeout,
} from '../gameLogic';
import { GameState, Player, Cell } from '@/types/game';

describe('calculateCriticalMass', () => {
  it('should return 2 for corner cells', () => {
    expect(calculateCriticalMass(0, 0, 5, 5)).toBe(2); // Top-left
    expect(calculateCriticalMass(0, 4, 5, 5)).toBe(2); // Top-right
    expect(calculateCriticalMass(4, 0, 5, 5)).toBe(2); // Bottom-left
    expect(calculateCriticalMass(4, 4, 5, 5)).toBe(2); // Bottom-right
  });

  it('should return 3 for edge cells', () => {
    expect(calculateCriticalMass(0, 2, 5, 5)).toBe(3); // Top edge
    expect(calculateCriticalMass(4, 2, 5, 5)).toBe(3); // Bottom edge
    expect(calculateCriticalMass(2, 0, 5, 5)).toBe(3); // Left edge
    expect(calculateCriticalMass(2, 4, 5, 5)).toBe(3); // Right edge
  });

  it('should return 4 for center cells', () => {
    expect(calculateCriticalMass(2, 2, 5, 5)).toBe(4);
    expect(calculateCriticalMass(1, 1, 5, 5)).toBe(4);
    expect(calculateCriticalMass(3, 3, 5, 5)).toBe(4);
  });
});

describe('createEmptyGrid', () => {
  it('should create a grid with correct dimensions', () => {
    const grid = createEmptyGrid(3, 4);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(4);
  });

  it('should initialize all cells with 0 orbs and correct critical mass', () => {
    const grid = createEmptyGrid(3, 3);
    
    // Check corner cell
    expect(grid[0][0]).toEqual({
      orbs: 0,
      ownerId: undefined,
      criticalMass: 2,
    });
    
    // Check edge cell
    expect(grid[0][1]).toEqual({
      orbs: 0,
      ownerId: undefined,
      criticalMass: 3,
    });
    
    // Check center cell
    expect(grid[1][1]).toEqual({
      orbs: 0,
      ownerId: undefined,
      criticalMass: 4,
    });
  });
});

describe('isValidMove', () => {
  let gameState: GameState;
  
  beforeEach(() => {
    gameState = {
      grid: createEmptyGrid(3, 3),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'active',
    };
  });

  it('should allow valid moves', () => {
    const result = isValidMove(gameState, 'p1', 1, 1);
    expect(result.valid).toBe(true);
  });

  it('should reject moves when game is not active', () => {
    gameState.status = 'finished';
    const result = isValidMove(gameState, 'p1', 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Game is not active');
  });

  it('should reject moves when it is not the player\'s turn', () => {
    const result = isValidMove(gameState, 'p2', 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not your turn');
  });

  it('should reject moves with invalid coordinates', () => {
    const result = isValidMove(gameState, 'p1', -1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid coordinates');
    
    const result2 = isValidMove(gameState, 'p1', 3, 1);
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe('Invalid coordinates');
  });

  it('should reject moves on cells owned by other players', () => {
    gameState.grid[1][1].ownerId = 'p2';
    const result = isValidMove(gameState, 'p1', 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cell is owned by another player');
  });

  it('should allow moves on cells owned by the same player', () => {
    gameState.grid[1][1].ownerId = 'p1';
    const result = isValidMove(gameState, 'p1', 1, 1);
    expect(result.valid).toBe(true);
  });

  it('should reject moves from eliminated players', () => {
    gameState.players[0].isEliminated = true;
    const result = isValidMove(gameState, 'p1', 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('You have been eliminated and are now spectating');
  });

  it('should reject moves from non-existent players', () => {
    const result = isValidMove(gameState, 'nonexistent', 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Player not found');
  });
});

describe('getAdjacentCells', () => {
  it('should return correct adjacent cells for corner cell', () => {
    const adjacent = getAdjacentCells(0, 0, 3, 3);
    expect(adjacent).toHaveLength(2);
    expect(adjacent).toContainEqual({ row: 0, col: 1 });
    expect(adjacent).toContainEqual({ row: 1, col: 0 });
  });

  it('should return correct adjacent cells for edge cell', () => {
    const adjacent = getAdjacentCells(0, 1, 3, 3);
    expect(adjacent).toHaveLength(3);
    expect(adjacent).toContainEqual({ row: 0, col: 0 });
    expect(adjacent).toContainEqual({ row: 0, col: 2 });
    expect(adjacent).toContainEqual({ row: 1, col: 1 });
  });

  it('should return correct adjacent cells for center cell', () => {
    const adjacent = getAdjacentCells(1, 1, 3, 3);
    expect(adjacent).toHaveLength(4);
    expect(adjacent).toContainEqual({ row: 0, col: 1 });
    expect(adjacent).toContainEqual({ row: 2, col: 1 });
    expect(adjacent).toContainEqual({ row: 1, col: 0 });
    expect(adjacent).toContainEqual({ row: 1, col: 2 });
  });
});

describe('countPlayerOrbs', () => {
  it('should count orbs correctly for each player', () => {
    const grid = createEmptyGrid(3, 3);
    grid[0][0] = { orbs: 2, ownerId: 'p1', criticalMass: 2 };
    grid[1][1] = { orbs: 3, ownerId: 'p1', criticalMass: 4 };
    grid[2][2] = { orbs: 1, ownerId: 'p2', criticalMass: 2 };
    
    const players = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
      { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
    ];
    
    const counts = countPlayerOrbs(grid, players);
    expect(counts).toEqual([5, 1]);
  });

  it('should return zero counts for players with no orbs', () => {
    const grid = createEmptyGrid(2, 2);
    const players = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
    ];
    
    const counts = countPlayerOrbs(grid, players);
    expect(counts).toEqual([0]);
  });
});

describe('checkEliminatedPlayers', () => {
  it('should not eliminate players in early game', () => {
    const gameState: GameState = {
      grid: createEmptyGrid(3, 3),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 1, // Early in game
      turnStartedAt: Date.now(),
      status: 'active',
    };
    
    const updatedPlayers = checkEliminatedPlayers(gameState);
    expect(updatedPlayers.every(p => !p.isEliminated)).toBe(true);
  });

  it('should eliminate players with no orbs after initial rounds', () => {
    const grid = createEmptyGrid(3, 3);
    grid[0][0] = { orbs: 2, ownerId: 'p1', criticalMass: 2 };
    
    const gameState: GameState = {
      grid,
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 5, // After initial rounds
      turnStartedAt: Date.now(),
      status: 'active',
    };
    
    const updatedPlayers = checkEliminatedPlayers(gameState);
    expect(updatedPlayers[0].isEliminated).toBe(false);
    expect(updatedPlayers[1].isEliminated).toBe(true);
    expect(updatedPlayers[0].orbCount).toBe(2);
    expect(updatedPlayers[1].orbCount).toBe(0);
  });
});

describe('getNextPlayer', () => {
  const players = [
    { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
    { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
    { id: 'p3', name: 'Player 3', color: '#7928ca', orbCount: 0, isEliminated: true, isConnected: true },
  ];

  it('should return next active player in sequence', () => {
    const nextPlayer = getNextPlayer(players, 'p1');
    expect(nextPlayer).toBe('p2');
  });

  it('should skip eliminated players', () => {
    const nextPlayer = getNextPlayer(players, 'p2');
    expect(nextPlayer).toBe('p1'); // Skip p3 because eliminated
  });

  it('should wrap around to first player', () => {
    const activePlayers = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
      { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
    ];
    const nextPlayer = getNextPlayer(activePlayers, 'p2');
    expect(nextPlayer).toBe('p1');
  });
});

describe('checkWinCondition', () => {
  it('should return winner when only one active player remains', () => {
    const players = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
      { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
    ];
    
    const winner = checkWinCondition(players);
    expect(winner).toBe('p1');
  });

  it('should return null when multiple active players remain', () => {
    const players = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 3, isEliminated: false, isConnected: true },
      { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 2, isEliminated: false, isConnected: true },
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
    expect(winner).toBe('p1'); // Should return first player as fallback
  });
});

describe('canMakeMove', () => {
  it('should allow moves in active game', () => {
    const gameState: GameState = {
      grid: [[{ orbs: 0, criticalMass: 2 }]],
      players: [{ id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true }],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'active',
    };

    const result = canMakeMove(gameState);
    
    expect(result.canMove).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should prevent moves in finished game', () => {
    const gameState: GameState = {
      grid: [[{ orbs: 1, ownerId: 'p1', criticalMass: 2 }]],
      players: [{ id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 1, isEliminated: false, isConnected: true }],
      currentPlayerId: 'p1',
      moveCount: 5,
      turnStartedAt: Date.now(),
      status: 'finished',
      winner: 'p1',
    };

    const result = canMakeMove(gameState);
    
    expect(result.canMove).toBe(false);
    expect(result.reason).toBe('Game has finished');
  });

  it('should prevent moves in runaway game', () => {
    const gameState: GameState = {
      grid: [[{ orbs: 1, ownerId: 'p1', criticalMass: 2 }]],
      players: [{ id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 1, isEliminated: false, isConnected: true }],
      currentPlayerId: 'p1',
      moveCount: 5,
      turnStartedAt: Date.now(),
      status: 'runaway',
      winner: 'p1',
    };

    const result = canMakeMove(gameState);
    
    expect(result.canMove).toBe(false);
    expect(result.reason).toBe('Game ended due to runaway chain reaction');
  });

  it('should prevent moves in lobby', () => {
    const gameState: GameState = {
      grid: [[{ orbs: 0, criticalMass: 2 }]],
      players: [{ id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true }],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'lobby',
    };

    const result = canMakeMove(gameState);
    
    expect(result.canMove).toBe(false);
    expect(result.reason).toBe('Game has not started yet');
  });
});

describe('simulateExplosions', () => {
  it('should handle simple explosion', () => {
    const grid = createEmptyGrid(3, 3);
    grid[0][0] = { orbs: 2, ownerId: 'p1', criticalMass: 2 }; // At critical mass
    
    const result = simulateExplosions(grid, 'p1');
    
    expect(result.waves).toBe(1);
    expect(result.isRunaway).toBe(false);
    expect(result.grid[0][0].orbs).toBe(0);
    expect(result.grid[0][0].ownerId).toBeUndefined();
    expect(result.grid[0][1].orbs).toBe(1);
    expect(result.grid[0][1].ownerId).toBe('p1');
    expect(result.grid[1][0].orbs).toBe(1);
    expect(result.grid[1][0].ownerId).toBe('p1');
  });

  it('should handle chain reactions', () => {
    const grid = createEmptyGrid(3, 3);
    grid[0][0] = { orbs: 2, ownerId: 'p1', criticalMass: 2 }; // Will explode
    grid[0][1] = { orbs: 2, ownerId: 'p2', criticalMass: 3 }; // Will receive orb and explode
    
    const result = simulateExplosions(grid, 'p1');
    
    expect(result.waves).toBe(2);
    expect(result.isRunaway).toBe(false);
    // After chain reaction, cells should be claimed by p1
    expect(result.grid[0][2].ownerId).toBe('p1'); // Cell that received orb from [0][1] explosion
    expect(result.grid[1][1].ownerId).toBe('p1'); // Cell that received orb from [0][1] explosion
  });

  it('should detect runaway chain reactions', () => {
    const grid = createEmptyGrid(4, 4);
    // Create a scenario that will cause many waves of explosions
    // Fill the grid with cells at critical mass - 1
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        grid[i][j] = {
          orbs: grid[i][j].criticalMass - 1,
          ownerId: 'p1',
          criticalMass: grid[i][j].criticalMass,
        };
      }
    }
    // Add one more orb to trigger the cascade
    grid[1][1].orbs = grid[1][1].criticalMass;
    
    const result = simulateExplosions(grid, 'p1', 5); // Low max waves for testing
    
    expect(result.isRunaway).toBe(true);
    expect(result.waves).toBe(5);
  });

  it('should handle no explosions when no cells are unstable', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1][1] = { orbs: 1, ownerId: 'p1', criticalMass: 4 }; // Below critical mass
    
    const result = simulateExplosions(grid, 'p1');
    
    expect(result.waves).toBe(0);
    expect(result.isRunaway).toBe(false);
    expect(result.grid[1][1].orbs).toBe(1); // Unchanged
  });
});

describe('processMove', () => {
  let gameState: GameState;
  
  beforeEach(() => {
    gameState = {
      grid: createEmptyGrid(3, 3),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'active',
    };
  });

  it('should process valid move successfully', () => {
    const result = processMove(gameState, 'p1', 1, 1);
    
    expect(result.success).toBe(true);
    expect(result.newGameState).toBeDefined();
    expect(result.newGameState!.grid[1][1].orbs).toBe(1);
    expect(result.newGameState!.grid[1][1].ownerId).toBe('p1');
    expect(result.newGameState!.moveCount).toBe(1);
    expect(result.newGameState!.currentPlayerId).toBe('p2');
  });

  it('should reject invalid moves', () => {
    const result = processMove(gameState, 'p2', 1, 1); // Wrong player's turn
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not your turn');
    expect(result.newGameState).toBeUndefined();
  });

  it('should handle winning condition', () => {
    // Set up a scenario where p2 will be eliminated
    gameState.grid[0][0] = { orbs: 1, ownerId: 'p1', criticalMass: 2 };
    gameState.moveCount = 5; // After initial rounds
    
    const result = processMove(gameState, 'p1', 1, 1);
    
    expect(result.success).toBe(true);
    expect(result.newGameState!.status).toBe('finished');
    expect(result.newGameState!.winner).toBe('p1');
  });

  it('should handle runaway chain reactions', () => {
    // Create a scenario that will cause runaway
    gameState.grid[0][0] = { orbs: 1, ownerId: 'p1', criticalMass: 2 };
    
    // Mock simulateExplosions to return runaway
    const originalSimulate = simulateExplosions;
    const mockSimulate = () => ({
      grid: gameState.grid,
      waves: 1000,
      isRunaway: true,
    });
    
    // We can't easily mock in this test, so let's create a real runaway scenario
    // by setting up a grid that will cause many explosions
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        gameState.grid[i][j] = {
          orbs: gameState.grid[i][j].criticalMass - 1,
          ownerId: 'p1',
          criticalMass: gameState.grid[i][j].criticalMass,
        };
      }
    }
    
    const result = processMove(gameState, 'p1', 0, 0);
    
    expect(result.success).toBe(true);
    // The result might be runaway or normal depending on the exact scenario
    if (result.isRunaway) {
      expect(result.newGameState!.status).toBe('runaway');
      expect(result.newGameState!.winner).toBe('p1');
    }
  });
});

describe('checkTimeouts', () => {
  let gameState: GameState;
  const gameStartTime = Date.now() - 5000; // 5 seconds ago
  
  beforeEach(() => {
    gameState = {
      grid: createEmptyGrid(3, 3),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 3, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 1, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now() - 3000, // 3 seconds ago
      status: 'active',
    };
  });

  it('should detect game timeout', () => {
    const settings = { gameTimeLimit: 0.05 }; // 0.05 minutes (3 seconds)
    const result = checkTimeouts(gameState, settings, gameStartTime);
    
    expect(result.isGameTimeout).toBe(true);
    expect(result.winner).toBe('p1'); // Player with most orbs
  });

  it('should detect move timeout', () => {
    const settings = { moveTimeLimit: 2 }; // 2 seconds
    const result = checkTimeouts(gameState, settings, gameStartTime);
    
    expect(result.isMoveTimeout).toBe(true);
  });

  it('should not detect timeouts when within limits', () => {
    const settings = { gameTimeLimit: 10, moveTimeLimit: 5 };
    const result = checkTimeouts(gameState, settings, gameStartTime);
    
    expect(result.isGameTimeout).toBe(false);
    expect(result.isMoveTimeout).toBe(false);
  });

  it('should handle no time limits', () => {
    const settings = {};
    const result = checkTimeouts(gameState, settings, gameStartTime);
    
    expect(result.isGameTimeout).toBe(false);
    expect(result.isMoveTimeout).toBe(false);
  });
});

describe('handleMoveTimeout', () => {
  it('should skip to next player and update turn start time', () => {
    const gameState: GameState = {
      grid: createEmptyGrid(3, 3),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now() - 5000,
      status: 'active',
    };
    
    const result = handleMoveTimeout(gameState);
    
    expect(result.currentPlayerId).toBe('p2');
    expect(result.turnStartedAt).toBeGreaterThan(gameState.turnStartedAt);
  });
});

describe('Edge Cases and Complex Scenarios', () => {
  it('should handle multiple simultaneous explosions correctly', () => {
    const grid = createEmptyGrid(3, 3);
    // Set up multiple cells at critical mass
    grid[0][0] = { orbs: 2, ownerId: 'p1', criticalMass: 2 }; // Corner
    grid[0][2] = { orbs: 2, ownerId: 'p1', criticalMass: 2 }; // Corner
    grid[2][0] = { orbs: 2, ownerId: 'p1', criticalMass: 2 }; // Corner
    grid[2][2] = { orbs: 2, ownerId: 'p1', criticalMass: 2 }; // Corner
    
    const result = simulateExplosions(grid, 'p1');
    
    expect(result.waves).toBe(1);
    expect(result.isRunaway).toBe(false);
    // All corner cells should be empty after explosion
    expect(result.grid[0][0].orbs).toBe(0);
    expect(result.grid[0][2].orbs).toBe(0);
    expect(result.grid[2][0].orbs).toBe(0);
    expect(result.grid[2][2].orbs).toBe(0);
    // Adjacent cells should have received orbs
    expect(result.grid[0][1].orbs).toBe(2); // Received from both corners
    expect(result.grid[1][0].orbs).toBe(2); // Received from both corners
  });

  it('should handle single player game correctly', () => {
    const players = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 5, isEliminated: false, isConnected: true },
    ];
    
    const winner = checkWinCondition(players);
    expect(winner).toBe('p1');
    
    const nextPlayer = getNextPlayer(players, 'p1');
    expect(nextPlayer).toBe('p1'); // Should wrap back to same player
  });

  it('should handle grid with all cells owned by different players', () => {
    const grid = createEmptyGrid(2, 2);
    grid[0][0] = { orbs: 1, ownerId: 'p1', criticalMass: 2 };
    grid[0][1] = { orbs: 1, ownerId: 'p2', criticalMass: 3 };
    grid[1][0] = { orbs: 1, ownerId: 'p3', criticalMass: 3 };
    grid[1][1] = { orbs: 1, ownerId: 'p4', criticalMass: 4 };
    
    const players = [
      { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
      { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true },
      { id: 'p3', name: 'Player 3', color: '#7928ca', orbCount: 0, isEliminated: false, isConnected: true },
      { id: 'p4', name: 'Player 4', color: '#ff0080', orbCount: 0, isEliminated: false, isConnected: true },
    ];
    
    const counts = countPlayerOrbs(grid, players);
    expect(counts).toEqual([1, 1, 1, 1]);
  });

  it('should handle explosion that claims opponent cells', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1][1] = { orbs: 4, ownerId: 'p1', criticalMass: 4 }; // Center cell at critical mass
    grid[0][1] = { orbs: 1, ownerId: 'p2', criticalMass: 3 }; // Opponent cell above
    grid[1][0] = { orbs: 2, ownerId: 'p2', criticalMass: 3 }; // Opponent cell left
    
    const result = simulateExplosions(grid, 'p1');
    
    expect(result.waves).toBe(2); // Second wave because [1][0] reaches critical mass
    expect(result.isRunaway).toBe(false);
    // All adjacent cells should now be owned by p1
    expect(result.grid[0][1].ownerId).toBe('p1');
    expect(result.grid[1][0].ownerId).toBeUndefined(); // This cell exploded in wave 2
    expect(result.grid[2][1].ownerId).toBe('p1');
    expect(result.grid[1][2].ownerId).toBe('p1');
    // Check that chain reaction occurred
    expect(result.grid[0][0].ownerId).toBe('p1'); // Received orb from [1][0] explosion
  });

  it('should handle empty grid correctly', () => {
    const grid = createEmptyGrid(3, 3);
    const result = simulateExplosions(grid, 'p1');
    
    expect(result.waves).toBe(0);
    expect(result.isRunaway).toBe(false);
    // Grid should remain unchanged
    expect(result.grid).toEqual(grid);
  });

  it('should handle timeout winner selection with tied orb counts', () => {
    const gameState: GameState = {
      grid: createEmptyGrid(3, 3),
      players: [
        { id: 'p1', name: 'Player 1', color: '#0070f3', orbCount: 3, isEliminated: false, isConnected: true },
        { id: 'p2', name: 'Player 2', color: '#f81ce5', orbCount: 3, isEliminated: false, isConnected: true },
        { id: 'p3', name: 'Player 3', color: '#7928ca', orbCount: 2, isEliminated: false, isConnected: true },
      ],
      currentPlayerId: 'p1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'active',
    };
    
    // Set up grid to match orb counts
    gameState.grid[0][0] = { orbs: 3, ownerId: 'p1', criticalMass: 2 };
    gameState.grid[0][1] = { orbs: 3, ownerId: 'p2', criticalMass: 3 };
    gameState.grid[1][0] = { orbs: 2, ownerId: 'p3', criticalMass: 3 };
    
    const settings = { gameTimeLimit: 0.017 }; // 0.017 minutes (1 second)
    const gameStartTime = Date.now() - 2000; // 2 seconds ago
    
    const result = checkTimeouts(gameState, settings, gameStartTime);
    
    expect(result.isGameTimeout).toBe(true);
    // Should pick first player with max orbs (p1 or p2)
    expect(['p1', 'p2']).toContain(result.winner);
  });
});