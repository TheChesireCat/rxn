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
  // Authentication state for claimed users
  isAuthenticated?: boolean;
  authUserId?: string;
  email?: string;
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
   * Validate that a claimed user's session is still valid with InstantDB
   */
  static async validateClaimedUser(): Promise<{ isValid: boolean; needsReauth?: boolean; email?: string }> {
    const session = this.getSession();
    
    // Unclaimed users are always valid
    if (!session?.isAuthenticated || !session.authUserId) {
      return { isValid: true };
    }

    try {
      // Import db here to avoid circular dependencies
      const { db } = await import('@/lib/instant');
      const authUser = await db.getAuth();
      
      // Check if InstantDB auth is still valid
      if (authUser?.id === session.authUserId) {
        return { isValid: true };
      } else {
        // Auth expired but we have email for re-authentication
        return { 
          isValid: false, 
          needsReauth: true, 
          email: session.email 
        };
      }
    } catch (error) {
      console.error('Error validating claimed user session:', error);
      return { 
        isValid: false, 
        needsReauth: !!session.email, 
        email: session.email 
      };
    }
  }

  /**
   * Clear session if authentication is invalid
   */
  static handleInvalidAuth(): void {
    const session = this.getSession();
    if (session?.isAuthenticated) {
      console.log('Clearing invalid authentication session');
      // Keep the user data but clear auth state
      const unclaimedUser: User = {
        ...session.user,
        authUserId: undefined,
        email: undefined,
        nameClaimedAt: undefined,
        isClaimed: false
      };
      
      // Store as unclaimed user
      this.storeSession(unclaimedUser, session.activeRoomId);
    }
  }

  /**
   * Update authentication state (for re-authentication)
   */
  static updateAuthState(authUserId: string, email: string): void {
    const session = this.getSession();
    if (session) {
      const claimedUser: User = {
        ...session.user,
        authUserId,
        email,
        nameClaimedAt: session.user.nameClaimedAt || Date.now(),
        isClaimed: true
      };
      
      this.storeSession(claimedUser, session.activeRoomId);
    }
  }

  /**
   * Store user session data in localStorage
   */
  static storeSession(user: User, activeRoomId?: string): void {
    if (typeof window === 'undefined') return;

    const sessionData: SessionData = {
      user,
      activeRoomId,
      lastActivity: Date.now(),
      // Store authentication state for claimed users
      isAuthenticated: user.isClaimed || false,
      authUserId: user.authUserId,
      email: user.email,
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
   * Update user data in existing session (for username claiming)
   */
  static updateUserInSession(updatedUser: User): void {
    const session = this.getSession();
    if (session) {
      // Merge updated user data while preserving session info
      const mergedUser: User = {
        ...session.user,
        ...updatedUser,
        // Ensure computed field is set correctly
        isClaimed: !!updatedUser.authUserId,
      };
      
      this.storeSession(mergedUser, session.activeRoomId);
    }
  }

  /**
   * Check if current session user is authenticated (claimed)
   */
  static isUserAuthenticated(): boolean {
    const session = this.getSession();
    return session?.isAuthenticated || false;
  }

  /**
   * Get authentication info from session
   */
  static getAuthInfo(): { authUserId?: string; email?: string } | null {
    const session = this.getSession();
    if (!session) return null;
    
    return {
      authUserId: session.authUserId,
      email: session.email,
    };
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