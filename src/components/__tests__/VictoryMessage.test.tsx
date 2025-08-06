import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VictoryMessage } from '../VictoryMessage';
import { GameState } from '@/types/game';

const mockGameState: GameState = {
  grid: [
    [{ orbs: 1, ownerId: 'player1', criticalMass: 2 }],
  ],
  players: [
    { id: 'player1', name: 'Alice', color: '#0070f3', orbCount: 1, isEliminated: false, isConnected: true },
    { id: 'player2', name: 'Bob', color: '#f81ce5', orbCount: 0, isEliminated: true, isConnected: true },
  ],
  currentPlayerId: 'player1',
  moveCount: 5,
  turnStartedAt: Date.now(),
  status: 'finished',
  winner: 'player1',
};

describe('VictoryMessage', () => {
  it('should not render when game is active', () => {
    const activeGameState = { ...mockGameState, status: 'active' as const };
    const { container } = render(
      <VictoryMessage gameState={activeGameState} currentUserId="player1" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render victory message when game is finished', () => {
    render(<VictoryMessage gameState={mockGameState} currentUserId="player1" />);
    
    expect(screen.getByText('🎉 Victory!')).toBeInTheDocument();
    expect(screen.getByText('Congratulations! You won!')).toBeInTheDocument();
    expect(screen.getByText('Alice is the last player standing!')).toBeInTheDocument();
  });

  it('should render different message when current user is not the winner', () => {
    render(<VictoryMessage gameState={mockGameState} currentUserId="player2" />);
    
    expect(screen.getByText('🎉 Victory!')).toBeInTheDocument();
    expect(screen.getByText('Alice wins!')).toBeInTheDocument();
    expect(screen.getByText('Alice is the last player standing!')).toBeInTheDocument();
  });

  it('should render runaway chain reaction message', () => {
    const runawayGameState = { ...mockGameState, status: 'runaway' as const };
    render(<VictoryMessage gameState={runawayGameState} currentUserId="player1" />);
    
    expect(screen.getByText('⚡ Runaway Chain Reaction!')).toBeInTheDocument();
    expect(screen.getByText('The chain reaction was too complex to simulate completely.')).toBeInTheDocument();
    expect(screen.getByText('Alice triggered the runaway reaction and wins!')).toBeInTheDocument();
  });

  it('should show elimination message for eliminated players', () => {
    render(<VictoryMessage gameState={mockGameState} currentUserId="player2" />);
    
    expect(screen.getByText('You were eliminated')).toBeInTheDocument();
    expect(screen.getByText(/You're now spectating the game/)).toBeInTheDocument();
  });

  it('should display game statistics', () => {
    render(<VictoryMessage gameState={mockGameState} currentUserId="player1" />);
    
    expect(screen.getByText('Total Moves')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Eliminated')).toBeInTheDocument();
    expect(screen.getByText('Winner Orbs')).toBeInTheDocument();
    
    // Check for specific values by finding the grid container
    const gridContainer = screen.getByText('Total Moves').closest('.grid');
    expect(gridContainer).toHaveTextContent('Total Moves5');
    expect(gridContainer).toHaveTextContent('Players2');
    expect(gridContainer).toHaveTextContent('Eliminated1');
  });

  it('should render action buttons', () => {
    render(<VictoryMessage gameState={mockGameState} currentUserId="player1" />);
    
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.getByText('Replay')).toBeInTheDocument();
  });

  it('should handle missing winner gracefully', () => {
    const gameStateWithoutWinner = { ...mockGameState, winner: undefined };
    render(<VictoryMessage gameState={gameStateWithoutWinner} currentUserId="player1" />);
    
    expect(screen.getByText('🎉 Victory!')).toBeInTheDocument();
    expect(screen.getByText('Game completed.')).toBeInTheDocument();
  });
});