import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameControls } from '../GameControls';
import { GameState, RoomSettings } from '@/types/game';

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
      isConnected: true,
    },
  ],
  currentPlayerId: 'player1',
  moveCount: 5,
  turnStartedAt: Date.now(),
  status: 'active',
};

const mockRoomSettings: RoomSettings = {
  maxPlayers: 4,
  boardSize: { rows: 2, cols: 2 },
  gameTimeLimit: 30,
  moveTimeLimit: 60,
  undoEnabled: true,
  isPrivate: false,
};

describe('GameControls', () => {
  it('renders game info correctly', () => {
    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    expect(screen.getByText('Board: 2 × 2')).toBeInTheDocument();
    expect(screen.getByText('Total Moves: 5')).toBeInTheDocument();
    expect(screen.getByText('Players: 2/2')).toBeInTheDocument();
  });

  it('shows undo button when enabled and conditions are met', () => {
    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeInTheDocument();
    expect(undoButton).not.toBeDisabled();
  });

  it('disables undo button when not current player turn', () => {
    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player2"
      />
    );

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeDisabled();
  });

  it('disables undo button when no moves made', () => {
    const gameStateNoMoves = {
      ...mockGameState,
      moveCount: 0,
    };

    render(
      <GameControls
        gameState={gameStateNoMoves}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeDisabled();
  });

  it('hides undo button when undo is disabled in settings', () => {
    const settingsNoUndo = {
      ...mockRoomSettings,
      undoEnabled: false,
    };

    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={settingsNoUndo}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  it('calls onUndo when undo button is clicked', async () => {
    const mockOnUndo = vi.fn().mockResolvedValue(undefined);

    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
        onUndo={mockOnUndo}
      />
    );

    const undoButton = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });
  });

  it('shows refresh button and calls onRefresh when clicked', () => {
    const mockOnRefresh = vi.fn();

    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not show finished game status (handled by VictoryMessage component)', () => {
    const finishedGameState = {
      ...mockGameState,
      status: 'finished' as const,
      winner: 'player1',
    };

    render(
      <GameControls
        gameState={finishedGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    // Victory messages are now handled by the VictoryMessage component
    expect(screen.queryByText('🎉 Game Finished!')).not.toBeInTheDocument();
  });

  it('does not show runaway status (handled by VictoryMessage component)', () => {
    const runawayGameState = {
      ...mockGameState,
      status: 'runaway' as const,
    };

    render(
      <GameControls
        gameState={runawayGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    // Victory messages are now handled by the VictoryMessage component
    expect(screen.queryByText('⚡ Runaway Chain Reaction!')).not.toBeInTheDocument();
  });

  it('shows lobby status', () => {
    const lobbyGameState = {
      ...mockGameState,
      status: 'lobby' as const,
    };

    render(
      <GameControls
        gameState={lobbyGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    expect(screen.getByText('Waiting in Lobby')).toBeInTheDocument();
  });

  it('displays room settings info', () => {
    render(
      <GameControls
        gameState={mockGameState}
        roomSettings={mockRoomSettings}
        gameStartTime={Date.now() - 300000}
        currentUserId="player1"
      />
    );

    expect(screen.getByText('✓ Undo enabled')).toBeInTheDocument();
    expect(screen.getByText('⏱ Game limit: 30min')).toBeInTheDocument();
    expect(screen.getByText('⏰ Move limit: 60s')).toBeInTheDocument();
  });
});