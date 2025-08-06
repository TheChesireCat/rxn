import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, PUT, DELETE } from '../route';

// Mock InstantDB
vi.mock('@/lib/instant', () => ({
  db: {
    queryOnce: vi.fn(),
    transact: vi.fn(),
    tx: {
      rooms: {}
    }
  }
}));

// Import the mocked db
import { db } from '@/lib/instant';
const mockDb = db as any;

describe('/api/game/undo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock transaction structure
    mockDb.tx.rooms = new Proxy({}, {
      get: (target, prop) => ({
        update: vi.fn().mockResolvedValue({})
      })
    }) as any;
  });

  const createMockRequest = (body: any, playerId?: string) => {
    const request = new NextRequest('http://localhost/api/game/undo', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(playerId && { 'x-player-id': playerId })
      }
    });
    return request;
  };

  const mockGameState = {
    grid: [
      [{ orbs: 1, ownerId: 'player1', criticalMass: 2 }],
      [{ orbs: 0, ownerId: undefined, criticalMass: 3 }]
    ],
    players: [
      { id: 'player1', name: 'Player 1', color: '#0070f3', orbCount: 1, isEliminated: false, isConnected: true },
      { id: 'player2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true }
    ],
    currentPlayerId: 'player1',
    moveCount: 1,
    turnStartedAt: Date.now() - 5000,
    status: 'active' as const
  };

  const mockPreviousGameState = {
    ...mockGameState,
    grid: [
      [{ orbs: 0, ownerId: undefined, criticalMass: 2 }],
      [{ orbs: 0, ownerId: undefined, criticalMass: 3 }]
    ],
    moveCount: 0,
    currentPlayerId: 'player2',
    turnStartedAt: Date.now() - 10000
  };

  const mockRoom = {
    id: 'room1',
    gameState: mockGameState,
    settings: { undoEnabled: true },
    history: [
      {
        gameState: mockPreviousGameState,
        timestamp: Date.now() - 5000,
        playerId: 'player1',
        move: { row: 0, col: 0 }
      }
    ]
  };

  describe('POST', () => {
    it('should successfully undo a move', async () => {
      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [mockRoom] }
      });
      mockDb.transact.mockResolvedValue({});

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.gameState).toEqual(expect.objectContaining({
        ...mockPreviousGameState,
        turnStartedAt: expect.any(Number)
      }));
      expect(mockDb.transact).toHaveBeenCalledWith(
        expect.objectContaining({})
      );
    });

    it('should reject undo when roomId is missing', async () => {
      const request = createMockRequest({}, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request: roomId is required');
    });

    it('should reject undo when player ID is missing', async () => {
      const request = createMockRequest({ roomId: 'room1' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Player ID required');
    });

    it('should reject undo when room is not found', async () => {
      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [] }
      });

      const request = createMockRequest({ roomId: 'nonexistent' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });

    it('should reject undo when undo is disabled', async () => {
      const roomWithUndoDisabled = {
        ...mockRoom,
        settings: { undoEnabled: false }
      };

      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [roomWithUndoDisabled] }
      });

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Undo is not enabled for this game');
    });

    it('should reject undo when game is not active', async () => {
      const finishedRoom = {
        ...mockRoom,
        gameState: { ...mockGameState, status: 'finished' as const }
      };

      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [finishedRoom] }
      });

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Game is not active');
    });

    it('should reject undo when it is not the player\'s turn', async () => {
      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [mockRoom] }
      });

      const request = createMockRequest({ roomId: 'room1' }, 'player2');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You can only undo on your turn');
    });

    it('should reject undo when no moves have been made', async () => {
      const roomWithNoMoves = {
        ...mockRoom,
        gameState: { ...mockGameState, moveCount: 0 }
      };

      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [roomWithNoMoves] }
      });

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No moves to undo');
    });

    it('should reject undo when no history is available', async () => {
      const roomWithNoHistory = {
        ...mockRoom,
        history: []
      };

      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [roomWithNoHistory] }
      });

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No previous game state available');
    });

    it('should reject undo when trying to undo another player\'s move', async () => {
      const roomWithOtherPlayerMove = {
        ...mockRoom,
        history: [
          {
            gameState: mockPreviousGameState,
            timestamp: Date.now() - 5000,
            playerId: 'player2', // Different player made the last move
            move: { row: 0, col: 0 }
          }
        ]
      };

      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [roomWithOtherPlayerMove] }
      });

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You can only undo your own moves');
    });

    it('should handle database transaction errors', async () => {
      mockDb.queryOnce.mockResolvedValue({
        data: { rooms: [mockRoom] }
      });
      mockDb.transact.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to undo move');
    });

    it('should handle unexpected errors', async () => {
      mockDb.queryOnce.mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest({ roomId: 'room1' }, 'player1');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Unsupported methods', () => {
    it('should return 405 for GET requests', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });
  });
});