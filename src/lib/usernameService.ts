import type { User, ApiResponse } from '@/types/game';

export interface UsernameCheckResult {
  available: boolean;
  isClaimed: boolean;
  isActive: boolean;
  reason?: string;
}

export interface LoginResult {
  success: boolean;
  needsEmail?: boolean;
  isClaimed?: boolean;
  email?: string;
  message?: string;
  error?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Client-side service for username operations
 * Provides a clean interface for components to interact with username APIs
 */
export class UsernameService {
  /**
   * Check if a username is available for claiming
   */
  static async checkAvailability(username: string): Promise<UsernameCheckResult> {
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        return {
          available: false,
          isClaimed: false,
          isActive: false,
          reason: result.error || 'Failed to check username availability',
        };
      }

      return result.data as UsernameCheckResult;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        isClaimed: false,
        isActive: false,
        reason: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Initiate login process with username
   * Returns whether email is needed and sends magic code if username is claimed
   */
  static async initiateLogin(username: string): Promise<LoginResult> {
    try {
      const response = await fetch('/api/auth/username-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to initiate login',
        };
      }

      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error('Error initiating login:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Send magic code to email address
   */
  static async sendMagicCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use the AuthService directly through the API
      const response = await fetch('/api/auth/send-magic-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result: ApiResponse = await response.json();

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error sending magic code:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Verify magic code and authenticate user
   */
  static async verifyCode(email: string, code: string): Promise<AuthenticationResult> {
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const result: ApiResponse<User> = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }

      return {
        success: true,
        user: result.data,
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Claim a username with email verification
   */
  static async claimUsername(username: string, email: string, code: string): Promise<AuthenticationResult> {
    try {
      const response = await fetch('/api/auth/claim-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, code }),
      });

      const result: ApiResponse<User> = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to claim username',
        };
      }

      return {
        success: true,
        user: result.data,
      };
    } catch (error) {
      console.error('Error claiming username:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Validate username format on client side
   */
  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: 'Username must be 20 characters or less' };
    }

    // Check format: letters, numbers, underscore, hyphen only
    const validFormat = /^[a-zA-Z0-9_-]+$/.test(trimmed);
    if (!validFormat) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscore, and hyphen' };
    }

    // Check for reserved names (case-insensitive)
    const reservedNames = [
      'admin', 'administrator', 'mod', 'moderator', 'system', 'bot', 'api',
      'support', 'help', 'guest', 'anonymous', 'user', 'player', 'spectator',
      'null', 'undefined', 'true', 'false', 'test', 'demo'
    ];

    if (reservedNames.includes(trimmed.toLowerCase())) {
      return { valid: false, error: 'This username is reserved' };
    }

    return { valid: true };
  }

  /**
   * Validate email format on client side
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    return { valid: true };
  }
}