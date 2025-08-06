import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TurnIndicator } from '../TurnIndicator';
import { GameState } from '@/types/game';

const mockGameState: GameState = {
  grid: [
    [{ orbs: 0, criticalMass: 2 }, { orbs: 1, ownerId: 'player1', criticalMass: 3 }],
    [{ orbs: 0, criticalMass: 3 }, { orbs: 2, ownerId: 'player2', criticalMass: 4 }],
  ],
  players: [
    {
      id: 'player1',
      name: 'Alice',
      color: '#ff0000',
      orbCount: 1,
      isEliminated: false,
      isConnected: true,
    },
    {
      id: 'player2',
      name: 'Bob',
      color: '#00ff00',
      orbCount: 2,
      isEliminated: false,
      isConnected: false,
    },
  ],
  currentPlayerId: 'player1',
  moveCount: 5,
  turnStartedAt: Date.now(),
  status: 'active',
};

describe('TurnIndicator', () => {
  it('shows current player turn for active game', () => {
    render(
      <TurnIndicator
        gameState={mockGameState}
        currentUserId="player2"
      />
    );

    expect(screen.getByText("Alice's turn")).toBeInTheDocument();
    expect(screen.getByText('Move #6')).toBeInTheDocument();
    expect(screen.getByText('Waiting for opponent')).toBeInTheDocument();
  });

  it('shows "Your turn" when it is current user\'s turn', () => {
    render(
      <TurnIndicator
        gameState={mockGameState}
        currentUserId="player1"
      />
    );

    expect(screen.getByText('Your turn')).toBeInTheDocument();
    expect(screen.getByText('Waiting for your move')).toBeInTheDocument();
  });

  it('shows offline warning when current player is disconnected', () => {
    const gameStateWithOfflinePlayer = {
      ...mockGameState,
      currentPlayerId: 'player2', // Bob is offline
    };

    render(
      <TurnIndicator
        gameState={gameStateWithOfflinePlayer}
        currentUserId="player1"
      />
    );

    expect(screen.getByText('Player is offline')).toBeInTheDocument();
  });

  it('does not render when game is not active', () => {
    const finishedGameState = {
      ...mockGameState,
      status: 'finished' as const,
    };

    const { container } = render(
      <TurnIndicator
        gameState={finishedGameState}
        currentUserId="player1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render when current player is not found', () => {
    const gameStateWithMissingPlayer = {
      ...mockGameState,
      currentPlayerId: 'nonexistent',
    };

    const { container } = render(
      <TurnIndicator
        gameState={gameStateWithMissingPlayer}
        currentUserId="player1"
      />
    );

    expect(container.firstChild).toBeNull();
  });
});