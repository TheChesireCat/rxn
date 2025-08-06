import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager, type SessionData, type RoomSession } from '../sessionManager';
import type { User } from '@/types/game';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window and localStorage
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('SessionManager', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'TestUser',
    wins: 5,
    gamesPlayed: 10,
    createdAt: Date.now(),
  };

  const mockRoomSession: RoomSession = {
    roomId: 'room-123',
    roomName: 'Test Room',
    joinedAt: Date.now(),
    role: 'player',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('storeSession', () => {
    it('should store user session data', () => {
      SessionManager.storeSession(mockUser, 'room-123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chainReaction_user',
        expect.stringContaining('"user":')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        SessionManager.storeSession(mockUser);
      }).not.toThrow();
    });
  });

  describe('getSession', () => {
    it('should retrieve valid session data', () => {
      const sessionData: SessionData = {
        user: mockUser,
        activeRoomId: 'room-123',
        lastActivity: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = SessionManager.getSession();
      expect(result).toEqual(sessionData);
    });

    it('should return null for expired sessions', () => {
      const expiredSession: SessionData = {
        user: mockUser,
        lastActivity: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSession));

      const result = SessionManager.getSession();
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = SessionManager.getSession();
      expect(result).toBeNull();
    });

    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = SessionManager.getSession();
      expect(result).toBeNull();
    });
  });

  describe('updateActivity', () => {
    it('should update activity timestamp for existing session', () => {
      const sessionData: SessionData = {
        user: mockUser,
        lastActivity: Date.now() - 1000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      SessionManager.updateActivity();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chainReaction_user',
        expect.stringContaining('"lastActivity":')
      );
    });

    it('should not update if no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      SessionManager.updateActivity();

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('clearSession', () => {
    it('should remove all session data', () => {
      SessionManager.clearSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('chainReaction_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('chainReaction_activeRoom');
    });
  });

  describe('storeActiveRoom', () => {
    it('should store active room data', () => {
      const sessionData: SessionData = {
        user: mockUser,
        lastActivity: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      SessionManager.storeActiveRoom(mockRoomSession);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chainReaction_activeRoom',
        JSON.stringify(mockRoomSession)
      );
    });

    it('should update room history', () => {
      const sessionData: SessionData = {
        user: mockUser,
        lastActivity: Date.now(),
      };

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(sessionData)) // For session
        .mockReturnValueOnce('[]'); // For room history

      SessionManager.storeActiveRoom(mockRoomSession);

      // Should be called twice: once for active room, once for room history
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3); // session update, active room, room history
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chainReaction_roomHistory',
        expect.stringContaining(mockRoomSession.roomId)
      );
    });
  });

  describe('getActiveRoom', () => {
    it('should retrieve active room data', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(null) // For session call (if any)
        .mockReturnValueOnce(JSON.stringify(mockRoomSession)); // For active room

      const result = SessionManager.getActiveRoom();
      expect(result).toEqual(mockRoomSession);
    });

    it('should return null if no active room', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = SessionManager.getActiveRoom();
      expect(result).toBeNull();
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const sessionData: SessionData = {
        user: mockUser,
        lastActivity: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      expect(SessionManager.isSessionValid()).toBe(true);
    });

    it('should return false for invalid session', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(SessionManager.isSessionValid()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from session', () => {
      const sessionData: SessionData = {
        user: mockUser,
        lastActivity: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = SessionManager.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return null if no session', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = SessionManager.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('hasActiveGame', () => {
    it('should return true when user has active game', () => {
      const sessionData: SessionData = {
        user: mockUser,
        lastActivity: Date.now(),
      };

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(sessionData))
        .mockReturnValueOnce(JSON.stringify(mockRoomSession));

      expect(SessionManager.hasActiveGame()).toBe(true);
    });

    it('should return false when no active game', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(SessionManager.hasActiveGame()).toBe(false);
    });
  });

  describe('getRoomHistory', () => {
    it('should return room history', () => {
      const history = [mockRoomSession];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(history));

      const result = SessionManager.getRoomHistory();
      expect(result).toEqual(history);
    });

    it('should return empty array if no history', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = SessionManager.getRoomHistory();
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = SessionManager.getRoomHistory();
      expect(result).toEqual([]);
    });
  });
});