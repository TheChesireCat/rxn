import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/authService';
import { usernameLoginLimiter } from '@/lib/rateLimiter';

// Mock the AuthService
vi.mock('@/lib/authService', () => ({
  AuthService: {
    checkUsernameAvailability: vi.fn(),
    sendMagicCodeToEmail: vi.fn(),
  }
}));

// Mock the rate limiter
vi.mock('@/lib/rateLimiter', () => ({
  usernameLoginLimiter: {
    check: vi.fn(),
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Remaining': '9',
    'X-RateLimit-Reset': '1234567890',
    'Retry-After': '900',
  })),
}));

describe('Username Login API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default rate limiter mock - allow requests
    vi.mocked(usernameLoginLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 900000,
    });
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/username-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('Input Validation', () => {
    it('should return 400 when username is missing', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username is required');
    });

    it('should return 400 when username is not a string', async () => {
      const request = createRequest({ username: 123 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username is required');
    });

    it('should return 400 when username is too short', async () => {
      const request = createRequest({ username: 'ab' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username must be at least 3 characters');
    });

    it('should trim whitespace from username', async () => {
      const mockAvailability = {
        available: true,
        isClaimed: false,
        isActive: false,
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);

      const request = createRequest({ username: '  testuser  ' });
      const response = await POST(request);

      expect(AuthService.checkUsernameAvailability).toHaveBeenCalledWith('testuser');
    });
  });

  describe('Available Username (New User)', () => {
    it('should return needsEmail=true for available username', async () => {
      const mockAvailability = {
        available: true,
        isClaimed: false,
        isActive: false,
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);

      const request = createRequest({ username: 'newuser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.needsEmail).toBe(true);
      expect(data.data.isClaimed).toBe(false);
      expect(data.data.message).toBe('Username is available for claiming');
    });
  });

  describe('Claimed Username (Returning User)', () => {
    it('should send magic code and return email for claimed username', async () => {
      const mockAvailability = {
        available: false,
        isClaimed: true,
        isActive: false,
        email: 'user@example.com',
      };

      const mockMagicCodeResult = {
        success: true,
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);
      vi.mocked(AuthService.sendMagicCodeToEmail).mockResolvedValue(mockMagicCodeResult);

      const request = createRequest({ username: 'claimeduser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.needsEmail).toBe(false);
      expect(data.data.isClaimed).toBe(true);
      expect(data.data.email).toBe('user@example.com');
      expect(data.data.message).toBe('Verification code sent to your email');

      expect(AuthService.sendMagicCodeToEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should return 500 when magic code sending fails', async () => {
      const mockAvailability = {
        available: false,
        isClaimed: true,
        isActive: false,
        email: 'user@example.com',
      };

      const mockMagicCodeResult = {
        success: false,
        error: 'Failed to send verification code',
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);
      vi.mocked(AuthService.sendMagicCodeToEmail).mockResolvedValue(mockMagicCodeResult);

      const request = createRequest({ username: 'claimeduser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send verification code');
    });
  });

  describe('Active Unclaimed Username', () => {
    it('should return 409 for active unclaimed username', async () => {
      const mockAvailability = {
        available: false,
        isClaimed: false,
        isActive: true,
        reason: 'Username is currently in use. Try another.',
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);

      const request = createRequest({ username: 'activeuser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username is currently in use. Try another.');
    });

    it('should use default error message when reason is not provided', async () => {
      const mockAvailability = {
        available: false,
        isClaimed: false,
        isActive: true,
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);

      const request = createRequest({ username: 'activeuser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username is currently in use. Try another.');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when AuthService throws an error', async () => {
      vi.mocked(AuthService.checkUsernameAvailability).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createRequest({ username: 'testuser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('System temporarily unavailable. Please try again.');
    });

    it('should handle malformed JSON request', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/username-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('System temporarily unavailable. Please try again.');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      vi.mocked(usernameLoginLimiter.check).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 900000,
      });

      const request = createRequest({ username: 'testuser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Too many attempts. Please wait before trying again.');
      
      // Check rate limit headers
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(response.headers.get('Retry-After')).toBe('900');
    });

    it('should include rate limit headers in successful responses', async () => {
      const mockAvailability = {
        available: true,
        isClaimed: false,
        isActive: false,
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);

      const request = createRequest({ username: 'testuser' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
    });

    it('should check rate limit before processing request', async () => {
      const request = createRequest({ username: 'testuser' });
      await POST(request);

      expect(usernameLoginLimiter.check).toHaveBeenCalledWith('127.0.0.1');
      expect(usernameLoginLimiter.check).toHaveBeenCalledBefore(
        vi.mocked(AuthService.checkUsernameAvailability)
      );
    });
  });

  describe('Requirements Verification', () => {
    it('should meet requirement 2.1: lookup associated email for claimed username', async () => {
      const mockAvailability = {
        available: false,
        isClaimed: true,
        isActive: false,
        email: 'user@example.com',
      };

      const mockMagicCodeResult = { success: true };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);
      vi.mocked(AuthService.sendMagicCodeToEmail).mockResolvedValue(mockMagicCodeResult);

      const request = createRequest({ username: 'claimeduser' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.email).toBe('user@example.com');
      expect(AuthService.checkUsernameAvailability).toHaveBeenCalledWith('claimeduser');
    });

    it('should meet requirement 2.2: automatically send magic code for valid username', async () => {
      const mockAvailability = {
        available: false,
        isClaimed: true,
        isActive: false,
        email: 'user@example.com',
      };

      const mockMagicCodeResult = { success: true };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailability);
      vi.mocked(AuthService.sendMagicCodeToEmail).mockResolvedValue(mockMagicCodeResult);

      const request = createRequest({ username: 'claimeduser' });
      await POST(request);

      expect(AuthService.sendMagicCodeToEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should meet requirement 4.1: determine if username is claimed or needs email', async () => {
      // Test claimed username
      const mockClaimedAvailability = {
        available: false,
        isClaimed: true,
        isActive: false,
        email: 'user@example.com',
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockClaimedAvailability);
      vi.mocked(AuthService.sendMagicCodeToEmail).mockResolvedValue({ success: true });

      const claimedRequest = createRequest({ username: 'claimeduser' });
      const claimedResponse = await POST(claimedRequest);
      const claimedData = await claimedResponse.json();

      expect(claimedData.data.needsEmail).toBe(false);
      expect(claimedData.data.isClaimed).toBe(true);

      // Test available username
      const mockAvailableAvailability = {
        available: true,
        isClaimed: false,
        isActive: false,
      };

      vi.mocked(AuthService.checkUsernameAvailability).mockResolvedValue(mockAvailableAvailability);

      const availableRequest = createRequest({ username: 'newuser' });
      const availableResponse = await POST(availableRequest);
      const availableData = await availableResponse.json();

      expect(availableData.data.needsEmail).toBe(true);
      expect(availableData.data.isClaimed).toBe(false);
    });
  });
});