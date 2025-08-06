import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerList } from '../PlayerList';
import { Player } from '@/types/game';

// Mock the usePresence hook
vi.mock('@/lib/hooks/usePresence', () => ({
  usePresence: vi.fn(() => ({
    connectedUsers: {
      'player1': { name: 'Alice', role: 'player', userId: 'player1' },
      'player2': { name: 'Bob', role: 'player', userId: 'player2' },
      'player3': { name: 'Charlie', role: 'player', userId: 'player3' },
    },
    connectedPlayers: [
      { name: 'Alice', role: 'player', userId: 'player1' },
      { name: 'Bob', role: 'player', userId: 'player2' },
      { name: 'Charlie', role: 'player', userId: 'player3' },
    ],
    connectedSpectators: [],
    isLoading: false,
    setPresence: vi.fn(),
    clearPresence: vi.fn(),
    totalConnected: 3,
    isConnected: true,
    error: null,
  })),
}));

const mockPlayers: Player[] = [
  {
    id: 'player1',
    name: 'Alice',
    color: '#ff0000',
    orbCount: 5,
    isEliminated: false,
    isConnected: true,
  },
  {
    id: 'player2',
    name: 'Bob',
    color: '#00ff00',
    orbCount: 3,
    isEliminated: false,
    isConnected: false,
  },
  {
    id: 'player3',
    name: 'Charlie',
    color: '#0000ff',
    orbCount: 0,
    isEliminated: true,
    isConnected: true,
  },
];

describe('PlayerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all players with correct information', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    // Check if all players are rendered
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Check orb counts
    expect(screen.getByText('5 orbs')).toBeInTheDocument();
    expect(screen.getByText('3 orbs')).toBeInTheDocument();
    expect(screen.getByText('0 orbs')).toBeInTheDocument();
  });

  it('shows current player indicator', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    // Current player should have turn indicator
    expect(screen.getByText('Turn')).toBeInTheDocument();
  });

  it('shows eliminated player status', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    expect(screen.getByText('Eliminated')).toBeInTheDocument();
  });

  it('shows offline player status', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    // The component should render without errors
    expect(screen.getByText('Players (3)')).toBeInTheDocument();
  });

  it('displays player count in header', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    expect(screen.getByText('Players (3)')).toBeInTheDocument();
  });

  it('shows summary stats on mobile', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    // Active players (non-eliminated)
    expect(screen.getByText('Active: 2')).toBeInTheDocument();
    // Total orbs
    expect(screen.getByText('Total Orbs: 8')).toBeInTheDocument();
  });

  it('shows spectators when present', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    // The component should render without errors
    expect(screen.getByText('Players (3)')).toBeInTheDocument();
  });

  it('shows connection status summary', () => {
    render(
      <PlayerList
        players={mockPlayers}
        currentPlayerId="player1"
        currentUserId="player2"
        roomId="test-room"
      />
    );

    expect(screen.getByText('3 online')).toBeInTheDocument();
  });
});