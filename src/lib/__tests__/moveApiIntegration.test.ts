import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/game/move/route';
import { NextRequest } from 'next/server';

// Mock the InstantDB for integration testing
vi.mock('@/lib/instant', () => ({
  db: {
    query: vi.fn(),
    transact: vi.fn(),
    tx: {
      rooms: {
        'integration-test-room': {
          update: vi.fn()
        }
      }
    }
  }
}));

import { db } from '@/lib/instant';

describe('Move API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete move processing flow', async () => {
    // Mock a realistic game scenario
    const mockRoom = {
      id: 'integration-test-room',
      name: 'Integration Test Room',
      status: 'active',
      hostId: 'player1',
      gameState: {
        grid: [
          [
            { orbs: 0, ownerId: undefined, criticalMass: 2 },
            { orbs: 0, ownerId: undefined, criticalMass: 3 },
            { orbs: 0, ownerId: undefined, criticalMass: 2 }
          ],
          [
            { orbs: 0, ownerId: undefined, criticalMass: 3 },
            { orbs: 0, ownerId: undefined, criticalMass: 4 },
            { orbs: 0, ownerId: undefined, criticalMass: 3 }
          ],
          [
            { orbs: 0, ownerId: undefined, criticalMass: 2 },
            { orbs: 0, ownerId: undefined, criticalMass: 3 },
            { orbs: 0, ownerId: undefined, criticalMass: 2 }
          ]
        ],
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            color: '#0070f3',
            orbCount: 0,
            isEliminated: false,
            isConnected: true
          },
          {
            id: 'player2',
            name: 'Player 2',
            color: '#f81ce5',
            orbCount: 0,
            isEliminated: false,
            isConnected: true
          }
        ],
        currentPlayerId: 'player1',
        moveCount: 0,
        turnStartedAt: Date.now(),
        status: 'active'
      },
      settings: {
        maxPlayers: 2,
        boardSize: { rows: 3, cols: 3 },
        undoEnabled: true,
        isPrivate: false
      },
      history: [],
      createdAt: Date.now()
    };

    // Mock database responses
    (db.query as any).mockResolvedValue({
      rooms: [mockRoom]
    });

    (db.transact as any).mockResolvedValue({});

    // Create a realistic HTTP request
    const requestBody = {
      roomId: 'integration-test-room',
      row: 1,
      col: 1
    };

    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: JSON.stringify(requestBody)
    });

    // Process the request
    const response = await POST(request);
    const responseData = await response.json();

    // Verify response structure
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data.gameState).toBeDefined();

    // Verify game state changes
    const newGameState = responseData.data.gameState;
    expect(newGameState.grid[1][1].orbs).toBe(1);
    expect(newGameState.grid[1][1].ownerId).toBe('player1');
    expect(newGameState.currentPlayerId).toBe('player2');
    expect(newGameState.moveCount).toBe(1);

    // Verify database was called correctly
    expect(db.query).toHaveBeenCalledWith({
      rooms: {
        $: { where: { id: 'integration-test-room' } }
      }
    });

    expect(db.transact).toHaveBeenCalled();
  });

  it('should handle error scenarios gracefully', async () => {
    // Mock database error
    (db.query as any).mockRejectedValue(new Error('Database connection failed'));

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
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe('Internal server error');
  });

  it('should validate JSON parsing errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/game/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player1'
      },
      body: 'invalid json'
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe('Internal server error');
  });
});