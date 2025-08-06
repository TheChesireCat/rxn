import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { GameRoom } from '../GameRoom';

// Mock all the dependencies
vi.mock('@/contexts/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useGameContext: () => ({
    room: {
      id: 'test-room',
      name: 'Test Room',
      settings: {
        gameTimeLimit: 600,
        moveTimeLimit: 30,
      },
      createdAt: Date.now(),
    },
    gameState: {
      grid: [[{ orbs: 0, criticalMass: 2 }]],
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          color: '#FF6B6B',
          orbCount: 1,
          isEliminated: false,
          isConnected: true,
        },
      ],
      currentPlayerId: 'player1',
      moveCount: 0,
      turnStartedAt: Date.now(),
      status: 'active',
    },
    isLoading: false,
    error: null,
    makeMove: vi.fn(),
    undoMove: vi.fn(),
    refreshRoom: vi.fn(),
  }),
}));

vi.mock('../SpectatorView', () => ({
  SpectatorView: ({ roomName }: { roomName: string }) => (
    <div data-testid="spectator-view">
      <h1>{roomName}</h1>
      <div>Spectator Mode Active</div>
    </div>
  ),
}));

vi.mock('../GameBoard', () => ({
  GameBoard: () => <div data-testid="game-board">Game Board</div>,
}));

vi.mock('../PlayerList', () => ({
  PlayerList: () => <div data-testid="player-list">Player List</div>,
}));

vi.mock('../TurnIndicator', () => ({
  TurnIndicator: () => <div data-testid="turn-indicator">Turn Indicator</div>,
}));

vi.mock('../GameControls', () => ({
  GameControls: () => <div data-testid="game-controls">Game Controls</div>,
}));

vi.mock('../VictoryMessage', () => ({
  VictoryMessage: () => <div data-testid="victory-message">Victory Message</div>,
}));

vi.mock('@/lib/timeoutUtils', () => ({
  handleGameTimeout: vi.fn(),
  handleMoveTimeout: vi.fn(),
}));

describe('Spectator Integration', () => {
  it('renders spectator view when user is not a player', () => {
    // User ID that is not in the players list
    const spectatorUserId = 'spectator1';
    
    render(<GameRoom roomId="test-room" currentUserId={spectatorUserId} />);

    // Should render spectator view instead of regular game view
    expect(screen.getByTestId('spectator-view')).toBeInTheDocument();
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('Spectator Mode Active')).toBeInTheDocument();
  });

  it('renders regular game view when user is a player', () => {
    // User ID that is in the players list
    const playerUserId = 'player1';
    
    render(<GameRoom roomId="test-room" currentUserId={playerUserId} />);

    // Should render regular game view, not spectator view
    expect(screen.queryByTestId('spectator-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    expect(screen.getByTestId('player-list')).toBeInTheDocument();
  });
});