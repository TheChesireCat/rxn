import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';
import { SpectatorJoinPrompt } from '../SpectatorJoinPrompt';
import { SessionManager } from '@/lib/sessionManager';
import type { Room, User } from '@/types/game';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/sessionManager', () => ({
  SessionManager: {
    storeActiveRoom: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

const mockPush = vi.fn();
(useRouter as any).mockReturnValue({
  push: mockPush,
});

const mockUser: User = {
  id: 'user1',
  name: 'Test User',
  wins: 0,
  gamesPlayed: 0,
  createdAt: Date.now(),
};

const mockRoom: Room = {
  id: 'room1',
  name: 'Test Room',
  status: 'active',
  hostId: 'host1',
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
    moveCount: 0,
    turnStartedAt: Date.now(),
    status: 'active',
  },
  settings: {
    maxPlayers: 2,
    boardSize: { rows: 2, cols: 2 },
    undoEnabled: false,
    isPrivate: false,
  },
  history: [],
  createdAt: Date.now(),
};

const defaultProps = {
  room: mockRoom,
  currentUser: mockUser,
  onCancel: jest.fn(),
};

describe('SpectatorJoinPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('renders spectator join prompt', () => {
    render(<SpectatorJoinPrompt {...defaultProps} />);

    expect(screen.getByText('Join as Spectator')).toBeInTheDocument();
    expect(screen.getByText(/This game is currently active and the room is full/)).toBeInTheDocument();
    expect(screen.getByText('Watch the game in real-time')).toBeInTheDocument();
    expect(screen.getByText('Cannot make moves or interact with the board')).toBeInTheDocument();
  });

  it('shows correct reason for active game', () => {
    const activeRoom = {
      ...mockRoom,
      gameState: {
        ...mockRoom.gameState,
        players: [mockRoom.gameState.players[0]], // Only one player
      },
    };

    render(<SpectatorJoinPrompt {...defaultProps} room={activeRoom} />);

    expect(screen.getByText('This game is currently active.')).toBeInTheDocument();
  });

  it('shows correct reason for full room', () => {
    const fullRoom = {
      ...mockRoom,
      gameState: {
        ...mockRoom.gameState,
        status: 'lobby' as const,
      },
    };

    render(<SpectatorJoinPrompt {...defaultProps} room={fullRoom} />);

    expect(screen.getByText('This room is full.')).toBeInTheDocument();
  });

  it('handles successful spectator join', async () => {
    const mockResponse = {
      success: true,
      data: {
        roomId: 'room1',
        room: mockRoom,
        playerRole: 'spectator',
        playerId: 'user1',
      },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SpectatorJoinPrompt {...defaultProps} />);

    const joinButton = screen.getByText('Join as Spectator');
    fireEvent.click(joinButton);

    expect(screen.getByText('Joining as Spectator...')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: 'room1',
          userName: 'Test User',
          userId: 'user1',
        }),
      });
    });

    await waitFor(() => {
      expect(SessionManager.storeActiveRoom).toHaveBeenCalledWith({
        roomId: 'room1',
        roomName: 'Test Room',
        joinedAt: expect.any(Number),
        role: 'spectator',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/room/room1');
    });
  });

  it('handles join error', async () => {
    const mockResponse = {
      success: false,
      error: 'Room not found',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => mockResponse,
    });

    render(<SpectatorJoinPrompt {...defaultProps} />);

    const joinButton = screen.getByText('Join as Spectator');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Room not found')).toBeInTheDocument();
    });

    expect(SessionManager.storeActiveRoom).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles network error', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<SpectatorJoinPrompt {...defaultProps} />);

    const joinButton = screen.getByText('Join as Spectator');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<SpectatorJoinPrompt {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables buttons while joining', async () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SpectatorJoinPrompt {...defaultProps} />);

    const joinButton = screen.getByText('Join as Spectator');
    const cancelButton = screen.getByText('Cancel');

    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(joinButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  it('displays room name', () => {
    render(<SpectatorJoinPrompt {...defaultProps} />);

    expect(screen.getByText('Test Room')).toBeInTheDocument();
  });
});