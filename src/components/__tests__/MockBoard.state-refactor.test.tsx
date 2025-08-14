import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it } from 'vitest';
import { MockBoard } from '../MockBoard';

// Mock the AnimatedCell and AnimationLayer components
vi.mock('../AnimatedCell', () => ({
  AnimatedCell: ({ cell, onCellClick, row, col }: any) => (
    <div 
      data-testid={`cell-${row}-${col}`}
      onClick={() => onCellClick(row, col)}
    >
      {cell.orbs} orbs, owner: {cell.ownerId || 'none'}
    </div>
  )
}));

vi.mock('../AnimationLayer', () => ({
  AnimationLayer: () => <div data-testid="animation-layer" />
}));

describe('MockBoard State Management Refactor', () => {
  const mockPlayers = [
    { id: 'player1', name: 'Player 1', color: '#3B82F6', isEliminated: false },
    { id: 'player2', name: 'Player 2', color: '#EF4444', isEliminated: false },
  ];

  it('should initialize with separate logical and display grids', () => {
    render(
      <MockBoard 
        interactive={true}
        initialSetup="empty"
        currentPlayer="player1"
        players={mockPlayers}
      />
    );

    // Should render empty 5x5 grid
    expect(screen.getByTestId('cell-0-0')).toHaveTextContent('0 orbs, owner: none');
    expect(screen.getByTestId('cell-2-2')).toHaveTextContent('0 orbs, owner: none'); // Center of 5x5
    expect(screen.getByTestId('cell-4-4')).toHaveTextContent('0 orbs, owner: none'); // Bottom-right corner
  });

  it('should handle simple placement without explosions', async () => {
    const mockOnMove = vi.fn();
    
    render(
      <MockBoard 
        interactive={true}
        initialSetup="empty"
        currentPlayer="player1"
        players={mockPlayers}
        onMove={mockOnMove}
      />
    );

    // Click on center cell (2,2 in 5x5 grid)
    fireEvent.click(screen.getByTestId('cell-2-2'));

    // Should call onMove
    expect(mockOnMove).toHaveBeenCalledWith(2, 2);

    // Should update display after animation
    await waitFor(() => {
      expect(screen.getByTestId('cell-2-2')).toHaveTextContent('1 orbs, owner: player1');
    }, { timeout: 1000 });
  });

  it('should prevent moves during animation', () => {
    const mockOnMove = vi.fn();
    
    render(
      <MockBoard 
        interactive={true}
        initialSetup="empty"
        currentPlayer="player1"
        players={mockPlayers}
        onMove={mockOnMove}
      />
    );

    // Click on center cell (2,2 in 5x5 grid)
    fireEvent.click(screen.getByTestId('cell-2-2'));
    
    // Immediately try to click another cell
    fireEvent.click(screen.getByTestId('cell-0-0'));

    // Should only call onMove once (for the first click)
    expect(mockOnMove).toHaveBeenCalledTimes(1);
    expect(mockOnMove).toHaveBeenCalledWith(2, 2);
  });

  it('should reset state when initialSetup changes', () => {
    const { rerender } = render(
      <MockBoard 
        interactive={true}
        initialSetup="slide1"
        currentPlayer="player1"
        players={mockPlayers}
      />
    );

    // Should have slide1 setup (new configuration: player1 orbs at (1,1), (2,2) and player2 orb at (3,3))
    expect(screen.getByTestId('cell-1-1')).toHaveTextContent('1 orbs, owner: player1');
    expect(screen.getByTestId('cell-2-2')).toHaveTextContent('1 orbs, owner: player1');
    expect(screen.getByTestId('cell-3-3')).toHaveTextContent('1 orbs, owner: player2');

    // Change to empty setup
    rerender(
      <MockBoard 
        interactive={true}
        initialSetup="empty"
        currentPlayer="player1"
        players={mockPlayers}
      />
    );

    // Should reset to empty
    expect(screen.getByTestId('cell-1-1')).toHaveTextContent('0 orbs, owner: none');
    expect(screen.getByTestId('cell-2-2')).toHaveTextContent('0 orbs, owner: none');
    expect(screen.getByTestId('cell-3-3')).toHaveTextContent('0 orbs, owner: none');
  });

  it('should prevent moves on opponent cells', () => {
    const mockOnMove = vi.fn();
    
    render(
      <MockBoard 
        interactive={true}
        initialSetup="slide1" // Has player1 orb in center (2,2)
        currentPlayer="player2" // But current player is player2
        players={mockPlayers}
        onMove={mockOnMove}
      />
    );

    // Try to click on player1's cell (center cell in 5x5 grid)
    fireEvent.click(screen.getByTestId('cell-2-2'));

    // Should not call onMove
    expect(mockOnMove).not.toHaveBeenCalled();
  });
});