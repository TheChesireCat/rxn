/**
 * Simple in-memory rate limiter for API endpoints
 * In production, this should be replaced with Redis or similar persistent storage
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier (IP address, user ID, etc.)
   * @returns Object with allowed status and remaining requests
   */
  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.store.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current status for a key without incrementing
   */
  getStatus(key: string): { count: number; remaining: number; resetTime: number } | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return null;
    }

    return {
      count: entry.count,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }
}

// Create rate limiter instances for different endpoints
export const usernameLoginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes per IP
});

export const usernameCheckLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute per IP
});

export const authLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 authentication attempts per hour per IP
});

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default value (in development)
  return '127.0.0.1';
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: { remaining: number; resetTime: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
  };
}