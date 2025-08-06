import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the database
vi.mock('@/lib/instant', () => ({
  db: {
    queryOnce: vi.fn(),
    transact: vi.fn(),
    tx: {
      rooms: {
        room123: {
          update: vi.fn()
        }
      }
    }
  }
}));

// Mock game logic functions
vi.mock('@/lib/gameLogic', () => ({
  checkTimeouts: vi.fn(),
  handleMoveTimeout: vi.fn()
}));

import { db } from '@/lib/instant';
import { checkTimeouts, handleMoveTimeout } from '@/lib/gameLogic';

describe('/api/game/timeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body)
    } as NextRequest;
  };

  const mockRoom = {
    id: 'room123',
    gameState: {
      grid: [[{ orbs: 1, ownerId: 'player1', criticalMass: 2 }]],
      players: [
        { id: 'player1', name: 'Player 1', color: '#0070f3', orbCount: 1, isEliminated: false, isConnected: true },
        { id: 'player2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true }
      ],
      currentPlayerId: 'player1',
      moveCount: 1,
      turnStartedAt: Date.now() - 25000, // 25 seconds ago
      status: 'active'
    },
    settings: {
      maxPlayers: 2,
      boardSize: { rows: 1, cols: 1 },
      gameTimeLimit: 10, // 10 minutes
      moveTimeLimit: 30, // 30 seconds
      undoEnabled: true,
      isPrivate: false
    },
    createdAt: Date.now() - 300000 // 5 minutes ago
  };

  it('handles game timeout correctly', async () => {
    const mockDb = vi.mocked(db);
    const mockCheckTimeouts = vi.mocked(checkTimeouts);

    mockDb.queryOnce.mockResolvedValueOnce({
      data: { rooms: [mockRoom] }
    });

    mockCheckTimeouts.mockReturnValueOnce({
      isGameTimeout: true,
      isMoveTimeout: false,
      winner: 'player1'
    });

    mockDb.transact.mockResolvedValueOnce(undefined);

    const request = createMockRequest({
      roomId: 'room123',
      type: 'game'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.gameState.status).toBe('finished');
    expect(data.data.gameState.winner).toBe('player1');
    expect(data.data.message).toBe('Game timed out. Winner determined by highest orb count.');
  });

  it('handles move timeout correctly', async () => {
    const mockDb = vi.mocked(db);
    const mockCheckTimeouts = vi.mocked(checkTimeouts);
    const mockHandleMoveTimeout = vi.mocked(handleMoveTimeout);

    mockDb.queryOnce.mockResolvedValueOnce({
      data: { rooms: [mockRoom] }
    });

    mockCheckTimeouts.mockReturnValueOnce({
      isGameTimeout: false,
      isMoveTimeout: true
    });

    const newGameState = {
      ...mockRoom.gameState,
      currentPlayerId: 'player2',
      turnStartedAt: Date.now()
    };

    mockHandleMoveTimeout.mockReturnValueOnce(newGameState);
    mockDb.transact.mockResolvedValueOnce(undefined);

    const request = createMockRequest({
      roomId: 'room123',
      type: 'move'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.gameState.currentPlayerId).toBe('player2');
    expect(data.data.message).toBe('Move timed out. Turn has been skipped.');
  });

  it('returns error when no timeout detected', async () => {
    const mockDb = vi.mocked(db);
    const mockCheckTimeouts = vi.mocked(checkTimeouts);

    mockDb.queryOnce.mockResolvedValueOnce({
      data: { rooms: [mockRoom] }
    });

    mockCheckTimeouts.mockReturnValueOnce({
      isGameTimeout: false,
      isMoveTimeout: false
    });

    const request = createMockRequest({
      roomId: 'room123',
      type: 'move'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No move timeout detected');
  });

  it('validates request body', async () => {
    const request = createMockRequest({
      roomId: 'room123'
      // Missing type
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request: roomId and type (game|move) are required');
  });

  it('handles room not found', async () => {
    const mockDb = vi.mocked(db);

    mockDb.queryOnce.mockResolvedValueOnce({
      data: { rooms: [] }
    });

    const request = createMockRequest({
      roomId: 'nonexistent',
      type: 'game'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Room not found');
  });

  it('handles inactive game', async () => {
    const mockDb = vi.mocked(db);
    const inactiveRoom = {
      ...mockRoom,
      gameState: {
        ...mockRoom.gameState,
        status: 'finished'
      }
    };

    mockDb.queryOnce.mockResolvedValueOnce({
      data: { rooms: [inactiveRoom] }
    });

    const request = createMockRequest({
      roomId: 'room123',
      type: 'game'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Game is not active');
  });

  it('handles database errors', async () => {
    const mockDb = vi.mocked(db);
    const mockCheckTimeouts = vi.mocked(checkTimeouts);

    mockDb.queryOnce.mockResolvedValueOnce({
      data: { rooms: [mockRoom] }
    });

    mockCheckTimeouts.mockReturnValueOnce({
      isGameTimeout: true,
      isMoveTimeout: false,
      winner: 'player1'
    });

    mockDb.transact.mockRejectedValueOnce(new Error('Database error'));

    const request = createMockRequest({
      roomId: 'room123',
      type: 'game'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to update game state');
  });
});