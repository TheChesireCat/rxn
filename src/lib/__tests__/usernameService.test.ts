import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsernameService } from '../usernameService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UsernameService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUsername', () => {
    it('should validate correct username format', () => {
      const result = UsernameService.validateUsername('validuser123');
      expect(result.valid).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      const result = UsernameService.validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject usernames that are too long', () => {
      const result = UsernameService.validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('20 characters or less');
    });

    it('should reject usernames with invalid characters', () => {
      const result = UsernameService.validateUsername('user@name');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letters, numbers, underscore, and hyphen');
    });

    it('should reject reserved usernames', () => {
      const result = UsernameService.validateUsername('admin');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reserved');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = UsernameService.validateEmail('user@example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(UsernameService.validateEmail('invalid-email').valid).toBe(false);
      expect(UsernameService.validateEmail('user@').valid).toBe(false);
      expect(UsernameService.validateEmail('@example.com').valid).toBe(false);
    });
  });

  describe('checkAvailability', () => {
    it('should return availability result on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          available: true,
          isClaimed: false,
          isActive: false,
        }
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.checkAvailability('testuser');

      expect(result.available).toBe(true);
      expect(result.isClaimed).toBe(false);
      expect(result.isActive).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser' })
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Username validation failed'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.checkAvailability('testuser');

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Username validation failed');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await UsernameService.checkAvailability('testuser');

      expect(result.available).toBe(false);
      expect(result.reason).toContain('Network error');
    });
  });

  describe('initiateLogin', () => {
    it('should return login result on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          needsEmail: false,
          isClaimed: true,
          email: 'user@example.com',
          message: 'Verification code sent'
        }
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.initiateLogin('claimeduser');

      expect(result.success).toBe(true);
      expect(result.needsEmail).toBe(false);
      expect(result.isClaimed).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Username not found'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.initiateLogin('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username not found');
    });
  });

  describe('verifyCode', () => {
    it('should return user on successful verification', async () => {
      const mockUser = {
        id: '1',
        name: 'testuser',
        wins: 5,
        gamesPlayed: 10,
        createdAt: Date.now()
      };

      const mockResponse = {
        success: true,
        data: mockUser
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.verifyCode('user@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', code: '123456' })
      });
    });

    it('should handle verification errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid verification code'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.verifyCode('user@example.com', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
    });
  });

  describe('claimUsername', () => {
    it('should return user on successful claim', async () => {
      const mockUser = {
        id: '1',
        name: 'newuser',
        wins: 0,
        gamesPlayed: 0,
        createdAt: Date.now()
      };

      const mockResponse = {
        success: true,
        data: mockUser
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.claimUsername('newuser', 'user@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/claim-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', email: 'user@example.com', code: '123456' })
      });
    });

    it('should handle claim errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Username already taken'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await UsernameService.claimUsername('taken', 'user@example.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already taken');
    });
  });
});