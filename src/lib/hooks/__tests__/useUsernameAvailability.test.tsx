import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useUsernameAvailability } from '../useUsernameAvailability';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUsernameAvailability());

    expect(result.current.isChecking).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.result).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should validate username format correctly', () => {
    const { result } = renderHook(() => useUsernameAvailability());

    // Valid usernames
    expect(result.current.validateFormat('validuser')).toBe(null);
    expect(result.current.validateFormat('user123')).toBe(null);
    expect(result.current.validateFormat('user_name')).toBe(null);
    expect(result.current.validateFormat('user-name')).toBe(null);

    // Invalid usernames
    expect(result.current.validateFormat('ab')).toBe('Username must be at least 3 characters');
    expect(result.current.validateFormat('a'.repeat(21))).toBe('Username must be 20 characters or less');
    expect(result.current.validateFormat('user@name')).toBe('Username can only contain letters, numbers, _ and -');
    expect(result.current.validateFormat('user name')).toBe('Username can only contain letters, numbers, _ and -');

    // Empty username should not show error
    expect(result.current.validateFormat('')).toBe(null);
    expect(result.current.validateFormat('   ')).toBe(null);
  });

  it('should debounce username checks', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ available: true, message: 'Username is available' }),
    } as Response);

    const { result } = renderHook(() => useUsernameAvailability());

    // Call checkUsername multiple times quickly
    act(() => {
      result.current.checkUsername('user1');
      result.current.checkUsername('user2');
      result.current.checkUsername('user3');
    });

    // Fast-forward time but not enough to trigger debounce
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockFetch).not.toHaveBeenCalled();

    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user3' }),
      });
    });
  });

  it('should handle available username response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        available: true, 
        message: 'Username is available' 
      }),
    } as Response);

    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('availableuser');
    });

    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(result.current.result).toEqual({
        available: true,
        message: 'Username is available'
      });
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle claimed username response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        available: false,
        isClaimed: true,
        isActive: false,
        message: 'This username is registered. Sign in to use it.'
      }),
    } as Response);

    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('claimeduser');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.result).toEqual({
        available: false,
        isClaimed: true,
        isActive: false,
        message: 'This username is registered. Sign in to use it.'
      });
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle active username response', async () => {
    const lastActive = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        available: false,
        isClaimed: false,
        isActive: true,
        lastActive,
        message: 'This username is currently in use.'
      }),
    } as Response);

    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('activeuser');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.result).toEqual({
        available: false,
        isClaimed: false,
        isActive: true,
        lastActive,
        message: 'This username is currently in use.'
      });
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle API errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('testuser');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.result).toBe(null);
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should handle HTTP error responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('testuser');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.result).toBe(null);
      expect(result.current.error).toBe('Failed to check username availability');
    });
  });

  it('should show format error for invalid usernames without API call', async () => {
    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('ab'); // Too short
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.result).toBe(null);
      expect(result.current.error).toBe('Username must be at least 3 characters');
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should clear state for empty username', async () => {
    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(false);
      expect(result.current.result).toBe(null);
      expect(result.current.error).toBe(null);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should set checking state during API call', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ available: true }),
        } as Response), 100)
      )
    );

    const { result } = renderHook(() => useUsernameAvailability());

    act(() => {
      result.current.checkUsername('testuser');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be checking now
    expect(result.current.isChecking).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);

    // Wait for API call to complete
    act(() => {
      vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isValid).toBe(true);
    });
  });
});