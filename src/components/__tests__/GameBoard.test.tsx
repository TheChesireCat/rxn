import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameBoard } from '../GameBoard';
import { GameState } from '@/types/game';
import { createEmptyGrid, PLAYER_COLORS } from '@/lib/gameLogic';

// Mock game state
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

describe('GameBoard', () => {
  const mockOnMove = vi.fn();
  const currentUserId = 'player1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game board with correct grid size', () => {
    const gameState = createMockGameState();
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    // Should render 9 cells for a 3x3 grid
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(9);
  });

  it('allows moves when it is current player turn', () => {
    const gameState = createMockGameState();
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    expect(firstCell).not.toBeDisabled();
  });

  it('disables moves when it is not current player turn', () => {
    const gameState = createMockGameState({
      currentPlayerId: 'player2',
    });
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    expect(firstCell).toBeDisabled();
  });

  it('calls onMove when cell is clicked during player turn', async () => {
    const gameState = createMockGameState();
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);

    await waitFor(() => {
      expect(mockOnMove).toHaveBeenCalledWith(0, 0);
    });
  });

  it('does not call onMove when not player turn', () => {
    const gameState = createMockGameState({
      currentPlayerId: 'player2',
    });
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);

    expect(mockOnMove).not.toHaveBeenCalled();
  });

  it('disables all cells when game is finished', () => {
    const gameState = createMockGameState({
      status: 'finished',
      winner: currentUserId,
    });
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    const cells = screen.getAllByRole('button');
    cells.forEach(cell => {
      expect(cell).toBeDisabled();
    });
  });

  it('disables all cells when game has runaway chain reaction', () => {
    const gameState = createMockGameState({
      status: 'runaway',
    });
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    const cells = screen.getAllByRole('button');
    cells.forEach(cell => {
      expect(cell).toBeDisabled();
    });
  });

  it('renders correct grid dimensions', () => {
    const gameState = createMockGameState({
      moveCount: 5,
    });
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
      />
    );

    // Should render 9 cells for a 3x3 grid
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(9);
  });

  it('shows loading state when submitting move', async () => {
    const slowOnMove = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    const gameState = createMockGameState();
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={slowOnMove}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);

    expect(screen.getByText('Submitting move...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Submitting move...')).not.toBeInTheDocument();
    });
  });

  it('shows error message when move fails', async () => {
    const failingOnMove = vi.fn().mockRejectedValue(new Error('Move failed'));
    const gameState = createMockGameState();
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={failingOnMove}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);

    await waitFor(() => {
      expect(screen.getByText('Move failed')).toBeInTheDocument();
    });
  });

  it('disables board when disabled prop is true', () => {
    const gameState = createMockGameState();
    
    render(
      <GameBoard
        gameState={gameState}
        currentUserId={currentUserId}
        onMove={mockOnMove}
        disabled={true}
      />
    );

    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);

    expect(mockOnMove).not.toHaveBeenCalled();
  });
});