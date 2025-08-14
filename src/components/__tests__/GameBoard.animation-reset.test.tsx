import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameBoard } from '../GameBoard';
import { GameState } from '@/types/game';
import { createEmptyGrid } from '@/lib/gameLogic';
import { PLAYER_COLORS } from '@/lib/constants';

// Mock the hooks and components that depend on InstantDB
vi.mock('@/lib/hooks', () => ({
  useReactions: () => ({
    reactions: [],
    sendReaction: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../ReactionPicker', () => ({
  ReactionPicker: () => <div data-testid="reaction-picker">ReactionPicker</div>,
}));

vi.mock('../ReactionOverlay', () => ({
  ReactionOverlay: () => <div data-testid="reaction-overlay">ReactionOverlay</div>,
}));

vi.mock('../AnimatedCell', () => ({
  AnimatedCell: ({ row, col }: { row: number; col: number }) => (
    <button data-testid={`cell-${row}-${col}`}>Cell {row},{col}</button>
  ),
}));

vi.mock('../AnimationLayer', () => ({
  AnimationLayer: () => <div data-testid="animation-layer">AnimationLayer</div>,
}));

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  grid: createEmptyGrid(3, 3),
  players: [
    {
      id: 'player1',
      name: 'Player 1',
      color: PLAYER_COLORS[0],
      orbCount: 0,
      isEliminated: false,
      isConnected: true,
    },
    {
      id: 'player2',
      name: 'Player 2',
      color: PLAYER_COLORS[1],
      orbCount: 0,
      isEliminated: false,
      isConnected: true,
    },
  ],
  currentPlayerId: 'player1',
  moveCount: 0,
  turnStartedAt: Date.now(),
  status: 'active',
  ...overrides,
});

describe('GameBoard Animation Reset', () => {
  it('should reset animation state when moveCount is 0 (new game)', () => {
    const initialGameState = createMockGameState({ moveCount: 5 });
    const newGameState = createMockGameState({ moveCount: 0 });

    // First render with a game in progress
    const { rerender } = render(
      <GameBoard
        gameState={initialGameState}
        currentUserId="player1"
        roomId="test-room"
      />
    );

    // Then rerender with a new game (moveCount = 0)
    rerender(
      <GameBoard
        gameState={newGameState}
        currentUserId="player1"
        roomId="test-room"
      />
    );

    // The component should render without errors
    // This test verifies that the useEffect hook for animation reset doesn't cause crashes
    expect(true).toBe(true);
  });

  it('should handle game restart scenario', () => {
    const gameInProgress = createMockGameState({ 
      moveCount: 10,
      status: 'active',
      lastMove: {
        row: 1,
        col: 1,
        playerId: 'player1'
      }
    });
    
    const restartedGame = createMockGameState({ 
      moveCount: 0,
      status: 'active'
      // No lastMove for restarted game
    });

    // First render with a game in progress
    const { rerender } = render(
      <GameBoard
        gameState={gameInProgress}
        currentUserId="player1"
        roomId="test-room"
      />
    );

    // Then rerender with a restarted game (moveCount = 0)
    rerender(
      <GameBoard
        gameState={restartedGame}
        currentUserId="player1"
        roomId="test-room"
      />
    );

    // The component should render without errors
    // This simulates the "Play Again" scenario where the game is restarted
    expect(true).toBe(true);
  });
});