import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../authService';

// Mock the admin database
vi.mock('../admin', () => ({
  adminDb: {
    query: vi.fn(),
    transact: vi.fn(),
    tx: {
      users: {}
    }
  }
}));

// Mock the instant database
vi.mock('../instant', () => ({
  db: {
    auth: {
      sendMagicCode: vi.fn(),
      signInWithMagicCode: vi.fn(),
      user: vi.fn(),
      signOut: vi.fn(),
    }
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUsername', () => {
    it('should validate correct username format', () => {
      const result = (AuthService as any).validateUsername('validuser123');
      expect(result.valid).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      const result = (AuthService as any).validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject usernames that are too long', () => {
      const result = (AuthService as any).validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('20 characters or less');
    });

    it('should reject usernames with invalid characters', () => {
      const result = (AuthService as any).validateUsername('user@name');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letters, numbers, underscore, and hyphen');
    });

    it('should reject reserved usernames', () => {
      const result = (AuthService as any).validateUsername('admin');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reserved');
    });

    it('should accept usernames with underscores and hyphens', () => {
      const result = (AuthService as any).validateUsername('user_name-123');
      expect(result.valid).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      const result = (AuthService as any).isValidEmail('user@example.com');
      expect(result).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect((AuthService as any).isValidEmail('invalid-email')).toBe(false);
      expect((AuthService as any).isValidEmail('user@')).toBe(false);
      expect((AuthService as any).isValidEmail('@example.com')).toBe(false);
      expect((AuthService as any).isValidEmail('user@example')).toBe(false);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return available for non-existent username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({ users: [] });

      const result = await AuthService.checkUsernameAvailability('newuser');
      
      expect(result.available).toBe(true);
      expect(result.isClaimed).toBe(false);
      expect(result.isActive).toBe(false);
    });

    it('should return unavailable for claimed username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({
        users: [{
          id: '1',
          name: 'claimeduser',
          authUserId: 'auth123',
          email: 'user@example.com',
          lastPlayedAt: Date.now() - 600000 // 10 minutes ago
        }]
      });

      const result = await AuthService.checkUsernameAvailability('claimeduser');
      
      expect(result.available).toBe(false);
      expect(result.isClaimed).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('should return unavailable for active unclaimed username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({
        users: [{
          id: '1',
          name: 'activeuser',
          authUserId: null,
          email: null,
          lastPlayedAt: Date.now() - 60000 // 1 minute ago
        }]
      });

      const result = await AuthService.checkUsernameAvailability('activeuser');
      
      expect(result.available).toBe(false);
      expect(result.isClaimed).toBe(false);
      expect(result.isActive).toBe(true);
    });

    it('should handle validation errors', async () => {
      const result = await AuthService.checkUsernameAvailability('ab');
      
      expect(result.available).toBe(false);
      expect(result.reason).toContain('at least 3 characters');
    });
  });

  describe('getEmailForUsername', () => {
    it('should return email for claimed username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({
        users: [{
          id: '1',
          name: 'claimeduser',
          authUserId: 'auth123',
          email: 'user@example.com'
        }]
      });

      const result = await AuthService.getEmailForUsername('claimeduser');
      
      expect(result).toBe('user@example.com');
    });

    it('should return null for unclaimed username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({
        users: [{
          id: '1',
          name: 'unclaimeduser',
          authUserId: null,
          email: null
        }]
      });

      const result = await AuthService.getEmailForUsername('unclaimeduser');
      
      expect(result).toBe(null);
    });

    it('should return null for non-existent username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({ users: [] });

      const result = await AuthService.getEmailForUsername('nonexistent');
      
      expect(result).toBe(null);
    });
  });

  describe('sendMagicCodeToEmail', () => {
    it('should send magic code successfully', async () => {
      const { db } = await import('../instant');
      (db.auth.sendMagicCode as any).mockResolvedValue(undefined);

      const result = await AuthService.sendMagicCodeToEmail('user@example.com');
      
      expect(result.success).toBe(true);
      expect(db.auth.sendMagicCode).toHaveBeenCalledWith({ email: 'user@example.com' });
    });

    it('should handle invalid email', async () => {
      const result = await AuthService.sendMagicCodeToEmail('invalid-email');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email address');
    });

    it('should handle send errors', async () => {
      const { db } = await import('../instant');
      (db.auth.sendMagicCode as any).mockRejectedValue(new Error('Send failed'));

      const result = await AuthService.sendMagicCodeToEmail('user@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to send verification code');
    });
  });

  describe('sendMagicCodeToUsername', () => {
    it('should send magic code to claimed username', async () => {
      const { adminDb } = await import('../admin');
      const { db } = await import('../instant');
      
      (adminDb.query as any).mockResolvedValue({
        users: [{
          id: '1',
          name: 'claimeduser',
          authUserId: 'auth123',
          email: 'user@example.com'
        }]
      });
      (db.auth.sendMagicCode as any).mockResolvedValue(undefined);

      const result = await AuthService.sendMagicCodeToUsername('claimeduser');
      
      expect(result.success).toBe(true);
      expect(result.email).toBe('user@example.com');
      expect(db.auth.sendMagicCode).toHaveBeenCalledWith({ email: 'user@example.com' });
    });

    it('should indicate email needed for unclaimed username', async () => {
      const { adminDb } = await import('../admin');
      (adminDb.query as any).mockResolvedValue({ users: [] });

      const result = await AuthService.sendMagicCodeToUsername('newuser');
      
      expect(result.success).toBe(false);
      expect(result.needsEmail).toBe(true);
      expect(result.error).toContain('not found or not registered');
    });
  });
});