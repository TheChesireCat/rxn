import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/game/move/route';
import { NextRequest } from 'next/server';
import { GameState, Player } from '@/types/game';
import { createEmptyGrid, PLAYER_COLORS } from '@/lib/gameLogic';

// Mock the InstantDB
vi.mock('@/lib/instant', () => ({
  db: {
    query: vi.fn(),
    transact: vi.fn(),
    tx: {
      rooms: {
        'test-room': {
          update: vi.fn()
        }
      }
    }
  }
}));

// Import the mocked db
import { db } from '@/lib/instant';

describe('Move API Endpoint', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      color: PLAYER_COLORS[0],
      orbCount: 0,
      isEliminated: false,
      isConnected: true
    },
    {
      id: 'player2',
      name: 'Player 2',
      color: PLAYER_COLORS[1],
      orbCount: 0,
      isEliminated: false,
      isConnected: true
    }
  ];

  const mockGameState: GameState = {
    grid: createEmptyGrid(3, 3),
    players: mockPlayers,
    currentPlayerId: 'player1',
    moveCount: 0,
    turnStartedAt: Date.now(),
    status: 'active'
  };

  const mockRoom = {
    id: 'test-room',
    name: 'Test Room',
    status: 'active',
    hostId: 'player1',
    gameState: mockGameState,
    settings: {
      maxPlayers: 2,
      boardSize: { rows: 3, cols: 3 },
      undoEnabled: true,
      isPrivate: false
    },
    history: [],
    createdAt: Date.now()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully process a valid move', async () => {
    // Mock database query to return room
    (db.query as any).mockResolvedValue({
      rooms: [mockRoom]
    });

    // Mock database transaction
    (db.transact as any).mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.gameState).toBeDefined();
    expect(data.data.gameState.grid[1][1].orbs).toBe(1);
    expect(data.data.gameState.grid[1][1].ownerId).toBe('player1');
    expect(data.data.gameState.currentPlayerId).toBe('player2');
  });

  it('should reject invalid move coordinates', async () => {
    (db.query as any).mockResolvedValue({
      rooms: [mockRoom]
    });

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: -1,
        col: 5
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid coordinates');
  });

  it('should reject move when not player\'s turn', async () => {
    (db.query as any).mockResolvedValue({
      rooms: [mockRoom]
    });

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player2' // Not current player
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Not your turn');
  });

  it('should reject move on opponent\'s cell', async () => {
    // Create game state with opponent's cell
    const gameStateWithOpponentCell = {
      ...mockGameState,
      grid: mockGameState.grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex === 1 && colIndex === 1) {
            return { ...cell, orbs: 1, ownerId: 'player2' };
          }
          return cell;
        })
      )
    };

    const roomWithOpponentCell = {
      ...mockRoom,
      gameState: gameStateWithOpponentCell
    };

    (db.query as any).mockResolvedValue({
      rooms: [roomWithOpponentCell]
    });

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Cell is owned by another player');
  });

  it('should handle chain reactions correctly', async () => {
    // Create a game state that will trigger an explosion
    const explosiveGameState = {
      ...mockGameState,
      grid: mockGameState.grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          // Set up corner cell (0,0) with 1 orb (critical mass = 2)
          if (rowIndex === 0 && colIndex === 0) {
            return { ...cell, orbs: 1, ownerId: 'player1', criticalMass: 2 };
          }
          return cell;
        })
      )
    };

    const roomWithExplosiveState = {
      ...mockRoom,
      gameState: explosiveGameState
    };

    (db.query as any).mockResolvedValue({
      rooms: [roomWithExplosiveState]
    });

    (db.transact as any).mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 0,
        col: 0
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // After explosion, corner cell should be empty
    expect(data.data.gameState.grid[0][0].orbs).toBe(0);
    expect(data.data.gameState.grid[0][0].ownerId).toBeUndefined();
    
    // Adjacent cells should have orbs
    expect(data.data.gameState.grid[0][1].orbs).toBe(1);
    expect(data.data.gameState.grid[1][0].orbs).toBe(1);
    expect(data.data.gameState.grid[0][1].ownerId).toBe('player1');
    expect(data.data.gameState.grid[1][0].ownerId).toBe('player1');
  });

  it('should handle runaway chain reactions', async () => {
    // Mock a scenario that would cause runaway detection
    const runawayGameState = {
      ...mockGameState,
      grid: Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => ({
          orbs: 3, // High orb count to trigger runaway
          ownerId: 'player1',
          criticalMass: row === 0 || row === 2 || col === 0 || col === 2 ? 
            (row === 0 && col === 0) || (row === 0 && col === 2) || 
            (row === 2 && col === 0) || (row === 2 && col === 2) ? 2 : 3 : 4
        }))
      )
    };

    const roomWithRunawayState = {
      ...mockRoom,
      gameState: runawayGameState
    };

    (db.query as any).mockResolvedValue({
      rooms: [roomWithRunawayState]
    });

    (db.transact as any).mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isRunaway).toBe(true);
    expect(data.data.gameState.status).toBe('runaway');
    expect(data.data.gameState.winner).toBe('player1');
  });

  it('should return 404 for non-existent room', async () => {
    (db.query as any).mockResolvedValue({
      rooms: []
    });

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'non-existent-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Room not found');
  });

  it('should return 401 when player ID is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Missing x-player-id header
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Player ID required');
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room'
        // Missing row and col
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid request');
  });

  it('should handle database transaction failures', async () => {
    (db.query as any).mockResolvedValue({
      rooms: [mockRoom]
    });

    // Mock database transaction failure
    (db.transact as any).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to update game state');
  });

  it('should handle move timeout correctly', async () => {
    // Create game state with expired move time
    const expiredMoveGameState = {
      ...mockGameState,
      turnStartedAt: Date.now() - 60000 // 1 minute ago
    };

    const roomWithTimeout = {
      ...mockRoom,
      gameState: expiredMoveGameState,
      settings: {
        ...mockRoom.settings,
        moveTimeLimit: 30 // 30 seconds
      }
    };

    (db.query as any).mockResolvedValue({
      rooms: [roomWithTimeout]
    });

    (db.transact as any).mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify({
        roomId: 'test-room',
        row: 1,
        col: 1
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Move timed out');
    expect(data.data.gameState.currentPlayerId).toBe('player2');
  });
});

// Import undo functions for testing
import { submitUndo, handleUndoSubmission } from '@/lib/moveApi';

describe('Undo API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('submitUndo', () => {
    it('should successfully submit undo request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            gameState: mockGameState,
            message: 'Move undone successfully'
          }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await submitUndo('test-room', 'player1');

      expect(global.fetch).toHaveBeenCalledWith('/api/game/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': 'player1'
        },
        body: JSON.stringify({ roomId: 'test-room' })
      });

      expect(result.gameState).toEqual(mockGameState);
      expect(result.message).toBe('Move undone successfully');
    });

    it('should throw error when undo request fails', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'You can only undo on your turn'
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(submitUndo('test-room', 'player1')).rejects.toThrow('You can only undo on your turn');
    });

    it('should throw error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Undo is not enabled for this game'
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(submitUndo('test-room', 'player1')).rejects.toThrow('Undo is not enabled for this game');
    });

    it('should throw default error when no error message provided', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(submitUndo('test-room', 'player1')).rejects.toThrow('Failed to undo move');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(submitUndo('test-room', 'player1')).rejects.toThrow('Network error');
    });
  });

  describe('handleUndoSubmission', () => {
    it('should successfully handle undo submission', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            gameState: mockGameState,
            message: 'Move undone successfully'
          }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await handleUndoSubmission('test-room', 'player1');

      expect(result.gameState).toEqual(mockGameState);
      expect(result.message).toBe('Move undone successfully');
    });

    it('should handle errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'No moves to undo'
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(handleUndoSubmission('test-room', 'player1')).rejects.toThrow('No moves to undo');
    });

    it('should handle unknown errors', async () => {
      (global.fetch as any).mockRejectedValue('Unknown error');

      await expect(handleUndoSubmission('test-room', 'player1')).rejects.toThrow('Failed to undo move');
    });
  });
});