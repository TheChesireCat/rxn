import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameProvider, useGameContext } from '../GameContext';
import { vi } from 'vitest';

// Mock InstantDB
vi.mock('../../lib/instant', () => ({
  db: {
    useQuery: vi.fn(() => ({
      data: { rooms: [] },
      isLoading: false,
      error: null,
    })),
  },
}));

// Test component that uses the context
function TestComponent() {
  const { room, gameState, isLoading, error } = useGameContext();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <div data-testid="room">{room ? 'has room' : 'no room'}</div>
      <div data-testid="gameState">{gameState ? 'has game state' : 'no game state'}</div>
    </div>
  );
}

describe('GameProvider', () => {
  it('should provide game context to children', () => {
    render(
      <GameProvider roomId="test-room">
        <TestComponent />
      </GameProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
    expect(screen.getByTestId('room')).toHaveTextContent('no room');
    expect(screen.getByTestId('gameState')).toHaveTextContent('no game state');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useGameContext must be used within a GameProvider');
    
    consoleSpy.mockRestore();
  });
});