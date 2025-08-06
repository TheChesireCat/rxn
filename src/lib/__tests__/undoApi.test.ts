import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitUndo, handleUndoSubmission } from '@/lib/moveApi';
import { GameState } from '@/types/game';

describe('Undo API Functions', () => {
  const mockGameState: GameState = {
    grid: [
      [{ orbs: 0, ownerId: undefined, criticalMass: 2 }],
      [{ orbs: 0, ownerId: undefined, criticalMass: 3 }]
    ],
    players: [
      { id: 'player1', name: 'Player 1', color: '#0070f3', orbCount: 0, isEliminated: false, isConnected: true },
      { id: 'player2', name: 'Player 2', color: '#f81ce5', orbCount: 0, isEliminated: false, isConnected: true }
    ],
    currentPlayerId: 'player2',
    moveCount: 0,
    turnStartedAt: Date.now(),
    status: 'active'
  };

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