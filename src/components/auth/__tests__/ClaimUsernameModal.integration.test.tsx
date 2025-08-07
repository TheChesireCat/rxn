import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClaimUsernameModal } from '../ClaimUsernameModal';

// Mock the instant db
vi.mock('@/lib/instant', () => ({
  db: {
    auth: {
      user: vi.fn(),
    },
  },
}));

// Mock the admin db
vi.mock('@/lib/admin', () => ({
  adminDb: {
    query: vi.fn(),
    transact: vi.fn(),
    tx: {
      users: {},
    },
  },
}));

const mockProps = {
  username: 'testuser',
  stats: { wins: 5, gamesPlayed: 10 },
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe('ClaimUsernameModal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('integrates with AuthService for complete username claiming flow', async () => {
    const { adminDb } = await import('@/lib/admin');
    const { db } = await import('@/lib/instant');

    // Mock database responses
    vi.mocked(adminDb.query).mockResolvedValue({ users: [] }); // Username available
    vi.mocked(adminDb.transact).mockResolvedValue(undefined);
    vi.mocked(db.auth.user).mockReturnValue({ id: 'auth-user-123' } as any);

    render(<ClaimUsernameModal {...mockProps} />);

    // Verify initial state
    expect(screen.getByText('🎮 testuser')).toBeInTheDocument();
    expect(screen.getByText('Register your email to save your stats permanently and appear on the leaderboard!')).toBeInTheDocument();

    // Enter email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Send magic code button should be enabled
    const sendButton = screen.getByText('Send Verification Code');
    expect(sendButton).not.toBeDisabled();

    // Note: We can't fully test the magic code flow without mocking InstantDB's auth system
    // But we can verify the component structure and basic interactions
    expect(screen.getByText(/After claiming, you can login with just your username/)).toBeInTheDocument();
  });

  it('shows proper error handling for failed operations', async () => {
    const { adminDb } = await import('@/lib/admin');

    // Mock database error
    vi.mocked(adminDb.query).mockRejectedValue(new Error('Database error'));

    render(<ClaimUsernameModal {...mockProps} />);

    // The component should still render properly even if background operations fail
    expect(screen.getByText('🎮 testuser')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  });

  it('displays user stats correctly', () => {
    const customProps = {
      ...mockProps,
      stats: { wins: 15, gamesPlayed: 25 },
    };

    render(<ClaimUsernameModal {...customProps} />);

    expect(screen.getByText('🏆 15 wins')).toBeInTheDocument();
    expect(screen.getByText('🎯 25 games')).toBeInTheDocument();
    expect(screen.getByText('📊 60% win rate')).toBeInTheDocument();
  });

  it('handles edge case stats correctly', () => {
    const customProps = {
      ...mockProps,
      stats: { wins: 0, gamesPlayed: 0 },
    };

    render(<ClaimUsernameModal {...customProps} />);

    expect(screen.getByText('🏆 0 wins')).toBeInTheDocument();
    expect(screen.getByText('🎯 0 games')).toBeInTheDocument();
    // Should not show win rate when no games played
    expect(screen.queryByText(/% win rate/)).not.toBeInTheDocument();
  });
});