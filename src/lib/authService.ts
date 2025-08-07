import { db } from './instant';
import { generateSmartSuggestions, generateValidationSuggestions } from './usernameSuggestions';
import type { User } from '@/types/game';

// Enhanced interfaces for better error handling
export interface UsernameCheckResult {
  available: boolean;
  isClaimed: boolean;
  isActive: boolean;
  email?: string;
  lastActive?: number;
  reason?: string;
  suggestions?: string[]; // Added for Requirement 1.5
  errorType?: 'validation' | 'availability' | 'network';
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  errorType?: 'validation' | 'auth' | 'network' | 'general';
  canRetry?: boolean; // Added for Requirement 2.4
  retryAction?: 'resend' | 'back' | 'retry';
  suggestions?: string[];
}

export interface MagicCodeResult {
  success: boolean;
  needsEmail?: boolean;
  email?: string;
  error?: string;
  errorType?: 'validation' | 'network' | 'rate-limit' | 'general';
  canRetry?: boolean;
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Authentication service for username-based magic code authentication
 * Handles username claiming, email lookup, and InstantDB magic code integration
 */
export class AuthService {
  /**
   * Check if a username is available for claiming
   * Enhanced with suggestions and better error categorization for Requirements 1.5, 4.4
   */
  static async checkUsernameAvailability(username: string): Promise<UsernameCheckResult> {
    try {
      // Validate username format - Requirement 4.4
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        const suggestions = generateValidationSuggestions(username, validation.error!);
        return {
          available: false,
          isClaimed: false,
          isActive: false,
          reason: validation.error,
          suggestions,
          errorType: 'validation',
        };
      }

      // Call API route to check username
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        const suggestions = generateSmartSuggestions(username);
        return {
          available: false,
          isClaimed: false,
          isActive: false,
          reason: 'System temporarily unavailable. Please try again.',
          suggestions,
          errorType: 'network',
        };
      }

      const data = await response.json();
      
      if (data.available) {
        return {
          available: true,
          isClaimed: false,
          isActive: false,
        };
      }

      // Generate suggestions when username is taken - Requirement 1.5
      const suggestions = generateSmartSuggestions(username);

      return {
        available: false,
        isClaimed: data.isClaimed || false,
        isActive: data.isActive || false,
        lastActive: data.lastActive,
        reason: data.message || 'Username is not available',
        suggestions,
        errorType: 'availability',
      };
    } catch (error) {
      console.error('Error checking username availability:', error);
      
      // Generate suggestions even on network error
      const suggestions = generateSmartSuggestions(username);
      
      return {
        available: false,
        isClaimed: false,
        isActive: false,
        reason: 'System temporarily unavailable. Please try again.',
        suggestions,
        errorType: 'network',
      };
    }
  }

  /**
   * Get email address associated with a claimed username
   */
  static async getEmailForUsername(username: string): Promise<string | null> {
    try {
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Only return email if username is claimed
      return data.isClaimed && data.email ? data.email : null;
    } catch (error) {
      console.error('Error getting email for username:', error);
      return null;
    }
  }

  /**
   * Send magic code to email address
   * Enhanced with better error handling and rate limiting
   */
  static async sendMagicCodeToEmail(email: string): Promise<MagicCodeResult> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address (e.g., user@example.com)',
          errorType: 'validation',
          canRetry: true
        };
      }

      // Use InstantDB's auth system to send magic code
      await db.auth.sendMagicCode({ email });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending magic code to email:', error);
      
      // Enhanced error handling with specific error types
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
          return {
            success: false,
            error: 'Too many verification requests. Please wait a few minutes before trying again.',
            errorType: 'rate-limit',
            canRetry: true,
            retryAfter: 300 // 5 minutes
          };
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          return {
            success: false,
            error: 'Network error. Please check your internet connection and try again.',
            errorType: 'network',
            canRetry: true
          };
        }
        
        if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
          return {
            success: false,
            error: 'The email address format appears to be invalid. Please check and try again.',
            errorType: 'validation',
            canRetry: true
          };
        }
        
        if (errorMessage.includes('blocked') || errorMessage.includes('spam')) {
          return {
            success: false,
            error: 'Email delivery blocked. Please check your spam folder or try a different email.',
            errorType: 'general',
            canRetry: true
          };
        }
      }
      
      return {
        success: false,
        error: 'Failed to send verification code. Please check your email and try again.',
        errorType: 'general',
        canRetry: true
      };
    }
  }

  /**
   * Send magic code to username (looks up email first)
   */
  static async sendMagicCodeToUsername(username: string): Promise<MagicCodeResult> {
    try {
      const email = await this.getEmailForUsername(username);
      
      if (!email) {
        return {
          success: false,
          needsEmail: true,
          error: 'Username not found or not registered',
        };
      }

      const result = await this.sendMagicCodeToEmail(email);
      return {
        ...result,
        email,
      };
    } catch (error) {
      console.error('Error sending magic code to username:', error);
      return {
        success: false,
        error: 'Failed to send verification code. Please try again.',
      };
    }
  }

  /**
   * Verify magic code and authenticate user
   * Enhanced with retry handling for Requirement 2.4
   */
  static async verifyMagicCode(email: string, code: string): Promise<AuthResult> {
    try {
      // Use InstantDB's auth system to verify the code
      const authResult = await db.auth.signInWithMagicCode({ email, code });
      
      if (!authResult.user) {
        return {
          success: false,
          error: 'Invalid verification code. Please check and try again.',
          errorType: 'auth',
          canRetry: true,
          retryAction: 'retry'
        };
      }

      // Call API to get user profile and update session info
      const response = await fetch('/api/auth/get-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, authUserId: authResult.user.id })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to complete authentication. Please try again.',
          errorType: 'network',
          canRetry: true,
          retryAction: 'retry'
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed',
          errorType: 'general',
          canRetry: false
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Error verifying magic code:', error);
      
      // Enhanced error handling with retry options - Requirement 2.4
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('expired')) {
          return {
            success: false,
            error: 'Verification code has expired. Please request a new code.',
            errorType: 'auth',
            canRetry: true,
            retryAction: 'resend'
          };
        }
        
        if (errorMessage.includes('invalid') || errorMessage.includes('wrong')) {
          return {
            success: false,
            error: 'Invalid verification code. Please check your email and try again.',
            errorType: 'auth',
            canRetry: true,
            retryAction: 'retry'
          };
        }
        
        if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
          return {
            success: false,
            error: 'Too many attempts. Please wait a moment before trying again.',
            errorType: 'auth',
            canRetry: true,
            retryAction: 'back'
          };
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          return {
            success: false,
            error: 'Network error. Please check your connection and try again.',
            errorType: 'network',
            canRetry: true,
            retryAction: 'retry'
          };
        }
      }

      return {
        success: false,
        error: 'Authentication failed. Please try again or request a new code.',
        errorType: 'general',
        canRetry: true,
        retryAction: 'retry'
      };
    }
  }

  /**
   * Claim a username and link it to an authenticated user
   */
  static async claimUsername(username: string, authUserId: string, email: string): Promise<AuthResult> {
    try {
      // Validate inputs
      const usernameValidation = this.validateUsername(username);
      if (!usernameValidation.valid) {
        return {
          success: false,
          error: usernameValidation.error,
        };
      }

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address',
        };
      }

      // Check if username is still available
      const availability = await this.checkUsernameAvailability(username);
      if (!availability.available) {
        return {
          success: false,
          error: availability.reason || 'Username is not available',
        };
      }

      // Call API to claim username
      const response = await fetch('/api/username/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authUserId, email })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to claim username. Please try again.',
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to claim username',
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Error claiming username:', error);
      return {
        success: false,
        error: 'Failed to claim username. Please try again.',
      };
    }
  }

  /**
   * Get current authenticated user from InstantDB
   */
  static getCurrentUser(): User | null {
    try {
      // Use client-side auth state
      const authUser = db.auth.user();
      if (!authUser?.email) {
        return null;
      }

      // For now, return a basic user object
      // The full user profile will be loaded by components that need it
      return {
        id: authUser.id,
        name: authUser.email.split('@')[0], // Fallback name
        wins: 0,
        gamesPlayed: 0,
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await db.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Validate username format and check for reserved names
   * Made public for use in components
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
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}