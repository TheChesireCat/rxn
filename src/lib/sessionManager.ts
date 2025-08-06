import type { User } from '@/types/game';

// Session storage keys
const SESSION_KEYS = {
  USER: 'chainReaction_user',
  ACTIVE_ROOM: 'chainReaction_activeRoom',
  ROOM_HISTORY: 'chainReaction_roomHistory',
} as const;

export interface SessionData {
  user: User;
  activeRoomId?: string;
  lastActivity: number;
}

export interface RoomSession {
  roomId: string;
  roomName: string;
  joinedAt: number;
  role: 'player' | 'spectator';
}

// Session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export class SessionManager {
  /**
   * Store user session data in localStorage
   */
  static storeSession(user: User, activeRoomId?: string): void {
    if (typeof window === 'undefined') return;

    const sessionData: SessionData = {
      user,
      activeRoomId,
      lastActivity: Date.now(),
    };

    try {
      localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  /**
   * Retrieve user session data from localStorage
   */
  static getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(SESSION_KEYS.USER);
      if (!stored) return null;

      const sessionData: SessionData = JSON.parse(stored);
      
      // Check if session has expired
      if (Date.now() - sessionData.lastActivity > SESSION_TIMEOUT) {
        this.clearSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update session activity timestamp
   */
  static updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      this.storeSession(session.user, session.activeRoomId);
    }
  }

  /**
   * Clear all session data
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(SESSION_KEYS.USER);
      localStorage.removeItem(SESSION_KEYS.ACTIVE_ROOM);
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  /**
   * Store active room information
   */
  static storeActiveRoom(roomSession: RoomSession): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SESSION_KEYS.ACTIVE_ROOM, JSON.stringify(roomSession));
      
      // Update user session with active room ID
      const session = this.getSession();
      if (session) {
        this.storeSession(session.user, roomSession.roomId);
      }

      // Add to room history
      this.addToRoomHistory(roomSession);
    } catch (error) {
      console.error('Failed to store active room:', error);
    }
  }

  /**
   * Get active room information
   */
  static getActiveRoom(): RoomSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(SESSION_KEYS.ACTIVE_ROOM);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to retrieve active room:', error);
      return null;
    }
  }

  /**
   * Clear active room information
   */
  static clearActiveRoom(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(SESSION_KEYS.ACTIVE_ROOM);
      
      // Update user session to remove active room ID
      const session = this.getSession();
      if (session) {
        this.storeSession(session.user);
      }
    } catch (error) {
      console.error('Failed to clear active room:', error);
    }
  }

  /**
   * Add room to history for quick rejoin
   */
  private static addToRoomHistory(roomSession: RoomSession): void {
    try {
      const stored = localStorage.getItem(SESSION_KEYS.ROOM_HISTORY);
      let history: RoomSession[] = stored ? JSON.parse(stored) : [];

      // Remove existing entry for this room
      history = history.filter(room => room.roomId !== roomSession.roomId);

      // Add new entry at the beginning
      history.unshift(roomSession);

      // Keep only last 10 rooms
      history = history.slice(0, 10);

      localStorage.setItem(SESSION_KEYS.ROOM_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to update room history:', error);
    }
  }

  /**
   * Get room history for quick access
   */
  static getRoomHistory(): RoomSession[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(SESSION_KEYS.ROOM_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve room history:', error);
      return [];
    }
  }

  /**
   * Validate if user session is still valid
   */
  static isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  /**
   * Get current user from session
   */
  static getCurrentUser(): User | null {
    const session = this.getSession();
    return session?.user || null;
  }

  /**
   * Check if user has an active game to rejoin
   */
  static hasActiveGame(): boolean {
    const session = this.getSession();
    const activeRoom = this.getActiveRoom();
    return !!(session && activeRoom);
  }
}