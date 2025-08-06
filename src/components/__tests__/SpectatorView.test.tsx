import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SpectatorView } from '../SpectatorView';
import { GameState } from '@/types/game';

// Mock the hooks and components
vi.mock('@/lib/hooks/usePresence', () => ({
  usePresence: () => ({
    connectedUsers: {},
    connectedPlayers: [],
    connectedSpectators: [],
    isLoading: false,
  }),
}));

vi.mock('../GameBoard', () => ({
  GameBoard: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="game-board" data-disabled={disabled}>
      Game Board
    </div>
  ),
}));

vi.mock('../PlayerList', () => ({
  PlayerList: () => <div data-testid="player-list">Player List</div>,
}));

vi.mock('../TurnIndicator', () => ({
  TurnIndicator: () => <div data-testid="turn-indicator">Turn Indicator</div>,
}));

vi.mock('../VictoryMessage', () => ({
  VictoryMessage: () => <div data-testid="victory-message">Victory Message</div>,
}));

vi.mock('../GameTimer', () => ({
  GameTimer: () => <div data-testid="game-timer">Game Timer</div>,
}));

vi.mock('../MoveTimer', () => ({
  MoveTimer: () => <div data-testid="move-timer">Move Timer</div>,
}));

const mockGameState: GameState = {
  grid: [
    [
      { orbs: 0, criticalMass: 2 },
      { orbs: 1, ownerId: 'player1', criticalMass: 3 },
    ],
    [
      { orbs: 2, ownerId: 'player2', criticalMass: 3 },
      { orbs: 0, criticalMass: 4 },
    ],
  ],
  players: [
    {
      id: 'player1',
      name: 'Player 1',
      color: '#FF6B6B',
      orbCount: 1,
      isEliminated: false,
      isConnected: true,
    },
    {
      id: 'player2',
      name: 'Player 2',
      color: '#4ECDC4',
      orbCount: 2,
      isEliminated: false,
      isConnected: true,
    },
  ],
  currentPlayerId: 'player1',
  moveCount: 3,
  turnStartedAt: Date.now(),
  status: 'active',
};

const defaultProps = {
  gameState: mockGameState,
  roomId: 'test-room-id',
  roomName: 'Test Room',
  currentUserId: 'spectator1',
  gameStartTime: Date.now() - 60000,
  roomSettings: {
    gameTimeLimit: 600,
    moveTimeLimit: 30,
  },
};

describe('SpectatorView', () => {
  it('renders spectator view with all components', () => {
    render(<SpectatorView {...defaultProps} />);

    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('Spectating')).toBeInTheDocument();
    expect(screen.getByText(/Room ID: test-room-id/)).toBeInTheDocument();
    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    expect(screen.getByTestId('player-list')).toBeInTheDocument();
    expect(screen.getByTestId('turn-indicator')).toBeInTheDocument();
  });

  it('disables game board for spectators', () => {
    render(<SpectatorView {...defaultProps} />);

    const gameBoard = screen.getByTestId('game-board');
    expect(gameBoard).toHaveAttribute('data-disabled', 'true');
  });

  it('shows spectator notice', () => {
    render(<SpectatorView {...defaultProps} />);

    expect(screen.getByText('Spectator Mode')).toBeInTheDocument();
    expect(screen.getByText(/You're watching this game/)).toBeInTheDocument();
  });

  it('shows victory message when game is finished', () => {
    const finishedGameState = {
      ...mockGameState,
      status: 'finished' as const,
      winner: 'player1',
    };

    render(
      <SpectatorView
        {...defaultProps}
        gameState={finishedGameState}
      />
    );

    expect(screen.getByTestId('victory-message')).toBeInTheDocument();
  });

  it('shows victory message when game is in runaway state', () => {
    const runawayGameState = {
      ...mockGameState,
      status: 'runaway' as const,
      winner: 'player1',
    };

    render(
      <SpectatorView
        {...defaultProps}
        gameState={runawayGameState}
      />
    );

    expect(screen.getByTestId('victory-message')).toBeInTheDocument();
  });

  it('shows game timers when active', () => {
    render(<SpectatorView {...defaultProps} />);

    expect(screen.getByTestId('game-timer')).toBeInTheDocument();
    expect(screen.getByTestId('move-timer')).toBeInTheDocument();
  });

  it('does not show turn indicator when game is not active', () => {
    const lobbyGameState = {
      ...mockGameState,
      status: 'lobby' as const,
    };

    render(
      <SpectatorView
        {...defaultProps}
        gameState={lobbyGameState}
      />
    );

    expect(screen.queryByTestId('turn-indicator')).not.toBeInTheDocument();
  });

  it('shows game statistics', () => {
    render(<SpectatorView {...defaultProps} />);

    expect(screen.getByText(/Moves:/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders without timers when not configured', () => {
    const propsWithoutTimers = {
      ...defaultProps,
      roomSettings: {},
    };

    render(<SpectatorView {...propsWithoutTimers} />);

    expect(screen.queryByTestId('game-timer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('move-timer')).not.toBeInTheDocument();
  });
});