import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usernameLoginLimiter, usernameCheckLimiter, getClientIP, createRateLimitHeaders } from '../rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset rate limiters before each test
    usernameLoginLimiter.reset('test-ip');
    usernameCheckLimiter.reset('test-ip');
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const result1 = usernameLoginLimiter.check('test-ip');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(9); // 10 max - 1 used

      const result2 = usernameLoginLimiter.check('test-ip');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(8); // 10 max - 2 used
    });

    it('should block requests when limit exceeded', () => {
      // Use up all allowed requests
      for (let i = 0; i < 10; i++) {
        const result = usernameLoginLimiter.check('test-ip');
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const blockedResult = usernameLoginLimiter.check('test-ip');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it('should track different IPs separately', () => {
      const result1 = usernameLoginLimiter.check('ip1');
      const result2 = usernameLoginLimiter.check('ip2');

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(9);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(9);
    });

    it('should reset after time window expires', async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Use up all requests
      for (let i = 0; i < 10; i++) {
        usernameLoginLimiter.check('test-ip');
      }

      // Should be blocked
      let result = usernameLoginLimiter.check('test-ip');
      expect(result.allowed).toBe(false);

      // Advance time past window (15 minutes + 1ms)
      currentTime += 15 * 60 * 1000 + 1;

      // Should be allowed again
      result = usernameLoginLimiter.check('test-ip');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Status Methods', () => {
    it('should return current status without incrementing', () => {
      usernameLoginLimiter.check('test-ip'); // Use 1 request

      const status = usernameLoginLimiter.getStatus('test-ip');
      expect(status).not.toBeNull();
      expect(status!.count).toBe(1);
      expect(status!.remaining).toBe(9);

      // Check again - should be same
      const status2 = usernameLoginLimiter.getStatus('test-ip');
      expect(status2!.count).toBe(1);
    });

    it('should return null for non-existent key', () => {
      const status = usernameLoginLimiter.getStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should reset specific key', () => {
      usernameLoginLimiter.check('test-ip');
      usernameLoginLimiter.check('test-ip');

      let status = usernameLoginLimiter.getStatus('test-ip');
      expect(status!.count).toBe(2);

      usernameLoginLimiter.reset('test-ip');

      status = usernameLoginLimiter.getStatus('test-ip');
      expect(status).toBeNull();

      // Next check should start fresh
      const result = usernameLoginLimiter.check('test-ip');
      expect(result.remaining).toBe(9);
    });
  });

  describe('Different Limiter Configurations', () => {
    it('should have different limits for different limiters', () => {
      // usernameLoginLimiter: 10 requests per 15 minutes
      // usernameCheckLimiter: 30 requests per 1 minute

      const loginResult = usernameLoginLimiter.check('test-ip');
      expect(loginResult.remaining).toBe(9); // 10 - 1

      const checkResult = usernameCheckLimiter.check('test-ip');
      expect(checkResult.remaining).toBe(29); // 30 - 1
    });
  });
});

describe('getClientIP', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    });

    const ip = getClientIP(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-real-ip': '192.168.1.2',
      },
    });

    const ip = getClientIP(request);
    expect(ip).toBe('192.168.1.2');
  });

  it('should extract IP from cf-connecting-ip header', () => {
    const request = new Request('http://localhost', {
      headers: {
        'cf-connecting-ip': '192.168.1.3',
      },
    });

    const ip = getClientIP(request);
    expect(ip).toBe('192.168.1.3');
  });

  it('should prioritize x-forwarded-for over other headers', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
        'cf-connecting-ip': '192.168.1.3',
      },
    });

    const ip = getClientIP(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should return default IP when no headers present', () => {
    const request = new Request('http://localhost');

    const ip = getClientIP(request);
    expect(ip).toBe('127.0.0.1');
  });
});

describe('createRateLimitHeaders', () => {
  it('should create proper rate limit headers', () => {
    const resetTime = Date.now() + 900000; // 15 minutes from now
    const result = {
      remaining: 5,
      resetTime,
    };

    const headers = createRateLimitHeaders(result);

    expect(headers['X-RateLimit-Remaining']).toBe('5');
    expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(resetTime / 1000).toString());
    expect(headers['Retry-After']).toBe(Math.ceil((resetTime - Date.now()) / 1000).toString());
  });
});