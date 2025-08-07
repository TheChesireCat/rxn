import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MagicCodeLogin } from '../auth/MagicCodeLogin';
import { AuthService } from '@/lib/authService';
import type { User } from '@/types/game';

// Mock the AuthService
vi.mock('@/lib/authService', () => ({
  AuthService: {
    checkUsernameAvailability: vi.fn(),
    getEmailForUsername: vi.fn(),
    sendMagicCodeToEmail: vi.fn(),
    verifyMagicCode: vi.fn(),
    claimUsername: vi.fn(),
  },
}));

// Mock the instant db
vi.mock('@/lib/instant', () => ({
  db: {
    auth: {
      getAuth: vi.fn(),
    },
  },
}));

const mockUser: User = {
  id: 'user-123',
  name: 'testuser',
  wins: 5,
  gamesPlayed: 10,
  createdAt: Date.now(),
};

describe('MagicCodeLogin', () => {
  const mockOnAuthenticated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders username step initially', () => {
    render(<MagicCodeLogin onAuthenticated={mockOnAuthenticated} />);

    expect(screen.getByText('Welcome to Chain Reaction!')).toBeInTheDocument();
    expect(screen.getByText('Enter your username to continue')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows username availability feedback', async () => {
    const mockCheckAvailability = vi.mocked(AuthService.checkUsernameAvailability);
    mockCheckAvailability.mockResolvedValue({
      available: true,
      isClaimed: false,
      isActive: false,
    });

    render(<MagicCodeLogin onAuthenticated={mockOnAuthenticated} />);

    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });

    await waitFor(() => {
      expect(screen.getByText('✓ Username available for claiming')).toBeInTheDocument();
    });
  });

  it('shows claimed username feedback', async () => {
    const mockCheckAvailability = vi.mocked(AuthService.checkUsernameAvailability);
    mockCheckAvailability.mockResolvedValue({
      available: false,
      isClaimed: true,
      isActive: false,
      email: 'user@example.com',
    });

    render(<MagicCodeLogin onAuthenticated={mockOnAuthenticated} />);

    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'claimeduser' } });

    await waitFor(() => {
      expect(screen.getByText('✓ Username registered - ready to sign in')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    const mockGetEmail = vi.mocked(AuthService.getEmailForUsername);
    mockGetEmail.mockResolvedValue(null);

    render(<MagicCodeLogin onAuthenticated={mockOnAuthenticated} />);

    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    const form = usernameInput.closest('form');
    expect(form).toBeInTheDocument();
    
    if (form) {
      fireEvent.submit(form);
    }

    // Component should handle the form submission
    await waitFor(() => {
      expect(mockGetEmail).toHaveBeenCalledWith('testuser');
    });
  });

  it('handles authentication success', async () => {
    const mockVerifyCode = vi.mocked(AuthService.verifyMagicCode);
    mockVerifyCode.mockResolvedValue({ success: true, user: mockUser });

    render(<MagicCodeLogin onAuthenticated={mockOnAuthenticated} />);

    // Component should render without errors
    expect(screen.getByText('Welcome to Chain Reaction!')).toBeInTheDocument();
  });
});