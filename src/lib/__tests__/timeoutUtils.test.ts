import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  handleGameTimeout, 
  handleMoveTimeout, 
  calculateTimeRemaining, 
  isTimeoutExpired, 
  formatTime, 
  formatSeconds 
} from '../timeoutUtils';

// Mock fetch
global.fetch = vi.fn();

describe('timeoutUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleGameTimeout', () => {
    it('calls timeout API with correct parameters', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true })
      } as Response);

      await handleGameTimeout('room123');

      expect(mockFetch).toHaveBeenCalledWith('/api/game/timeout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: 'room123',
          type: 'game'
        }),
      });
    });

    it('handles API errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Test error' })
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleGameTimeout('room123');

      expect(consoleSpy).toHaveBeenCalledWith('Game timeout handling failed:', 'Test error');
      consoleSpy.mockRestore();
    });

    it('handles network errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleGameTimeout('room123');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to handle game timeout:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('handleMoveTimeout', () => {
    it('calls timeout API with correct parameters', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true })
      } as Response);

      await handleMoveTimeout('room456');

      expect(mockFetch).toHaveBeenCalledWith('/api/game/timeout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: 'room456',
          type: 'move'
        }),
      });
    });
  });

  describe('calculateTimeRemaining', () => {
    it('calculates remaining time correctly', () => {
      const now = Date.now();
      const startTime = now - 5000; // 5 seconds ago
      const limitInSeconds = 10; // 10 second limit

      const remaining = calculateTimeRemaining(startTime, limitInSeconds);
      
      expect(remaining).toBe(5000); // 5 seconds remaining
    });

    it('returns 0 when time has expired', () => {
      const now = Date.now();
      const startTime = now - 15000; // 15 seconds ago
      const limitInSeconds = 10; // 10 second limit

      const remaining = calculateTimeRemaining(startTime, limitInSeconds);
      
      expect(remaining).toBe(0);
    });

    it('returns full time when just started', () => {
      const now = Date.now();
      const startTime = now; // Just started
      const limitInSeconds = 30; // 30 second limit

      const remaining = calculateTimeRemaining(startTime, limitInSeconds);
      
      expect(remaining).toBe(30000); // 30 seconds remaining
    });
  });

  describe('isTimeoutExpired', () => {
    it('returns false when time remaining', () => {
      const now = Date.now();
      const startTime = now - 5000; // 5 seconds ago
      const limitInSeconds = 10; // 10 second limit

      const expired = isTimeoutExpired(startTime, limitInSeconds);
      
      expect(expired).toBe(false);
    });

    it('returns true when time has expired', () => {
      const now = Date.now();
      const startTime = now - 15000; // 15 seconds ago
      const limitInSeconds = 10; // 10 second limit

      const expired = isTimeoutExpired(startTime, limitInSeconds);
      
      expect(expired).toBe(true);
    });
  });

  describe('formatTime', () => {
    it('formats time correctly in MM:SS format', () => {
      expect(formatTime(125000)).toBe('02:05'); // 2 minutes 5 seconds
      expect(formatTime(65000)).toBe('01:05'); // 1 minute 5 seconds
      expect(formatTime(30000)).toBe('00:30'); // 30 seconds
      expect(formatTime(5000)).toBe('00:05'); // 5 seconds
    });

    it('handles zero time', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('handles large times', () => {
      expect(formatTime(3665000)).toBe('61:05'); // 61 minutes 5 seconds
    });

    it('rounds up partial seconds', () => {
      expect(formatTime(4500)).toBe('00:05'); // 4.5 seconds rounds up to 5
      expect(formatTime(4100)).toBe('00:05'); // 4.1 seconds rounds up to 5
    });
  });

  describe('formatSeconds', () => {
    it('formats seconds correctly', () => {
      expect(formatSeconds(30000)).toBe('30s');
      expect(formatSeconds(5000)).toBe('5s');
      expect(formatSeconds(1000)).toBe('1s');
    });

    it('handles zero time', () => {
      expect(formatSeconds(0)).toBe('0s');
    });

    it('rounds up partial seconds', () => {
      expect(formatSeconds(4500)).toBe('5s'); // 4.5 seconds rounds up to 5
      expect(formatSeconds(4100)).toBe('5s'); // 4.1 seconds rounds up to 5
    });
  });
});