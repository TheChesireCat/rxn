import { useState, useEffect, useCallback } from 'react';
import { SessionManager, type SessionData, type RoomSession } from '../sessionManager';
import type { User, ApiResponse } from '@/types/game';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeRoom: RoomSession | null;
  roomHistory: RoomSession[];
  // New fields for claimed user authentication
  isClaimed: boolean;
  authUserId?: string;
  email?: string;
}

export interface AuthActions {
  createUser: (username: string, authUserId?: string, email?: string) => Promise<User>;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
  joinRoom: (roomId: string, roomName: string, role: 'player' | 'spectator') => void;
  leaveRoom: () => void;
  refreshSession: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    activeRoom: null,
    roomHistory: [],
    isClaimed: false,
    authUserId: undefined,
    email: undefined,
  });

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = () => {
      const session = SessionManager.getSession();
      const activeRoom = SessionManager.getActiveRoom();
      const roomHistory = SessionManager.getRoomHistory();

      setState({
        user: session?.user || null,
        isLoading: false,
        isAuthenticated: !!session,
        activeRoom,
        roomHistory,
        isClaimed: session?.user?.isClaimed || false,
        authUserId: session?.authUserId,
        email: session?.email,
      });
    };

    initializeSession();
  }, []);

  // Update activity timestamp periodically
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(() => {
      SessionManager.updateActivity();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  /**
   * Create a new user session (for both claimed and unclaimed users)
   */
  const createUser = useCallback(async (username: string, authUserId?: string, email?: string): Promise<User> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const requestBody: any = { name: username };
      
      // Include auth info for claimed users
      if (authUserId && email) {
        requestBody.authUserId = authUserId;
        requestBody.email = email;
      }

      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: ApiResponse<User> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create user');
      }

      const user = result.data;

      // Store session with authentication info
      SessionManager.storeSession(user);

      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
        isAuthenticated: true,
        isClaimed: user.isClaimed || false,
        authUserId: user.authUserId,
        email: user.email,
      }));

      return user;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Update user data in current session (for username claiming)
   */
  const updateUser = useCallback((updatedUser: User) => {
    // Update session storage
    SessionManager.updateUserInSession(updatedUser);

    // Update state
    setState(prev => ({
      ...prev,
      user: updatedUser,
      isClaimed: updatedUser.isClaimed || false,
      authUserId: updatedUser.authUserId,
      email: updatedUser.email,
    }));
  }, []);

  /**
   * Logout and clear session
   */
  const logout = useCallback(() => {
    SessionManager.clearSession();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      activeRoom: null,
      roomHistory: [],
    });
  }, []);

  /**
   * Join a room and store session
   */
  const joinRoom = useCallback((roomId: string, roomName: string, role: 'player' | 'spectator') => {
    const roomSession: RoomSession = {
      roomId,
      roomName,
      joinedAt: Date.now(),
      role,
    };

    SessionManager.storeActiveRoom(roomSession);

    setState(prev => ({
      ...prev,
      activeRoom: roomSession,
      roomHistory: SessionManager.getRoomHistory(),
    }));
  }, []);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    SessionManager.clearActiveRoom();
    setState(prev => ({
      ...prev,
      activeRoom: null,
    }));
  }, []);

  /**
   * Refresh session data from localStorage
   */
  const refreshSession = useCallback(() => {
    const session = SessionManager.getSession();
    const activeRoom = SessionManager.getActiveRoom();
    const roomHistory = SessionManager.getRoomHistory();

    setState(prev => ({
      ...prev,
      user: session?.user || null,
      isAuthenticated: !!session,
      activeRoom,
      roomHistory,
    }));
  }, []);

  return {
    ...state,
    createUser,
    logout,
    joinRoom,
    leaveRoom,
    refreshSession,
  };
}