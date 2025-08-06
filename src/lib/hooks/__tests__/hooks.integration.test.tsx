import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameProvider } from '../../../contexts/GameContext';
import { useGameState } from '../useGameState';
import { usePresence } from '../usePresence';
import { vi } from 'vitest';

// Mock InstantDB
vi.mock('../../instant', () => ({
  db: {
    useQuery: vi.fn(() => ({
      data: { rooms: [] },
      isLoading: false,
      error: null,
    })),
    room: vi.fn(() => ({
      usePresence: vi.fn(() => ({
        isLoading: false,
        user: null,
        peers: {},
      })),
      publishPresence: vi.fn(),
    })),
  },
}));

// Test component for useGameState
function GameStateTestComponent() {
  const gameState = useGameState();
  
  return (
    <div>
      <div data-testid="is-loading">{gameState.isGameActive ? 'active' : 'inactive'}</div>
      <div data-testid="total-orbs">{gameState.getTotalOrbs()}</div>
      <div data-testid="active-players">{gameState.activePlayers.length}</div>
    </div>
  );
}

// Test component for usePresence
function PresenceTestComponent() {
  const presence = usePresence('test-room', 'test-user');
  
  return (
    <div>
      <div data-testid="is-connected">{presence.isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="total-connected">{presence.totalConnected}</div>
      <div data-testid="connected-players">{presence.connectedPlayers.length}</div>
    </div>
  );
}

describe('Game Hooks Integration', () => {
  describe('useGameState', () => {
    it('should provide default game state when no data', () => {
      render(
        <GameProvider roomId="test-room">
          <GameStateTestComponent />
        </GameProvider>
      );

      expect(screen.getByTestId('is-loading')).toHaveTextContent('inactive');
      expect(screen.getByTestId('total-orbs')).toHaveTextContent('0');
      expect(screen.getByTestId('active-players')).toHaveTextContent('0');
    });
  });

  describe('usePresence', () => {
    it('should provide default presence state', () => {
      render(<PresenceTestComponent />);

      expect(screen.getByTestId('is-connected')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('total-connected')).toHaveTextContent('0');
      expect(screen.getByTestId('connected-players')).toHaveTextContent('0');
    });
  });

  describe('hooks integration', () => {
    it('should work together in a game context', () => {
      render(
        <GameProvider roomId="test-room">
          <GameStateTestComponent />
          <PresenceTestComponent />
        </GameProvider>
      );

      // Both components should render without errors
      expect(screen.getByTestId('is-loading')).toBeInTheDocument();
      expect(screen.getByTestId('is-connected')).toBeInTheDocument();
    });
  });
});