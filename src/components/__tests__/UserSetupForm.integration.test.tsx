import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UserSetupForm } from '../UserSetupForm';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('UserSetupForm Integration', () => {
  const mockOnUserCreated = vi.fn();
  const mockOnClaimRequired = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show real-time availability feedback for available username', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        available: true,
        message: 'Username is available'
      }),
    } as Response);

    render(
      <UserSetupForm 
        onUserCreated={mockOnUserCreated}
        onClaimRequired={mockOnClaimRequired}
      />
    );

    const input = screen.getByLabelText('Username');
    
    // Type a valid username
    fireEvent.change(input, { target: { value: 'testuser' } });

    // Should show checking state initially
    expect(screen.getByText('Checking availability...')).toBeInTheDocument();

    // Wait for API call and result
    await waitFor(() => {
      expect(screen.getByText('Available! This username is ready to use.')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Should have made API call
    expect(mockFetch).toHaveBeenCalledWith('/api/username/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser' }),
    });
  });

  it('should show error for claimed username', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        available: false,
        isClaimed: true,
        isActive: false,
        message: 'This username is registered. Sign in to use it.'
      }),
    } as Response);

    render(
      <UserSetupForm 
        onUserCreated={mockOnUserCreated}
        onClaimRequired={mockOnClaimRequired}
      />
    );

    const input = screen.getByLabelText('Username');
    
    // Type a claimed username
    fireEvent.change(input, { target: { value: 'claimeduser' } });

    // Wait for API call and result
    await waitFor(() => {
      expect(screen.getByText('This username is registered. Sign in to use it.')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Button should show "Sign In with This Username"
    expect(screen.getByText('Sign In with This Username')).toBeInTheDocument();
  });

  it('should show format validation error without API call', async () => {
    render(
      <UserSetupForm 
        onUserCreated={mockOnUserCreated}
        onClaimRequired={mockOnClaimRequired}
      />
    );

    const input = screen.getByLabelText('Username');
    
    // Type an invalid username (too short)
    fireEvent.change(input, { target: { value: 'ab' } });

    // Should show format error immediately
    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    });

    // Should not have made API call
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show visual indicators in input field', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        available: true,
        message: 'Username is available'
      }),
    } as Response);

    render(
      <UserSetupForm 
        onUserCreated={mockOnUserCreated}
        onClaimRequired={mockOnClaimRequired}
      />
    );

    const input = screen.getByLabelText('Username');
    
    // Type a valid username
    fireEvent.change(input, { target: { value: 'testuser' } });

    // Should show spinner initially
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for result and check for success icon
    await waitFor(() => {
      expect(document.querySelector('.text-green-500')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Input should have green border
    expect(input).toHaveClass('border-green-300');
  });

  it('should handle empty username correctly', async () => {
    render(
      <UserSetupForm 
        onUserCreated={mockOnUserCreated}
        onClaimRequired={mockOnClaimRequired}
      />
    );

    const input = screen.getByLabelText('Username');
    
    // Type and then clear username
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: '' } });

    // Should not show any indicators for empty input
    expect(screen.queryByText('Checking availability...')).not.toBeInTheDocument();
    expect(screen.queryByText('Available! This username is ready to use.')).not.toBeInTheDocument();
    
    // Should not have made API call for empty string
    expect(mockFetch).not.toHaveBeenCalled();
  });
});