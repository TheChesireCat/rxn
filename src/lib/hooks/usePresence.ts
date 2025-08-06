'use client';

import { useEffect, useState, useCallback } from 'react';
import { db } from '../instant';

// Presence data structure
interface PresenceData {
  name: string;
  role: 'player' | 'spectator';
  userId: string;
}

interface UsePresenceReturn {
  // Current user's presence
  isConnected: boolean;
  setPresence: (data: PresenceData) => void;
  clearPresence: () => void;
  
  // Other users' presence
  connectedUsers: Record<string, PresenceData>;
  connectedPlayers: PresenceData[];
  connectedSpectators: PresenceData[];
  totalConnected: number;
  
  // Connection status
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing player presence in a game room
 * Handles real-time connection status and user roles
 */
export function usePresence(roomId: string, userId?: string): UsePresenceReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Get the game room for presence
  const room = db.room('gameRoom', roomId);

  // Subscribe to presence updates - publishPresence is returned from usePresence
  const { 
    isLoading: presenceLoading, 
    user, 
    peers,
    publishPresence 
  } = room.usePresence({
    keys: ['name', 'role', 'userId'],
  });

  // Update loading state
  useEffect(() => {
    setIsLoading(presenceLoading);
  }, [presenceLoading]);

  // Track connection status
  useEffect(() => {
    setIsConnected(!!user);
  }, [user]);

  // Set presence data
  const setPresence = useCallback((data: PresenceData) => {
    try {
      setError(null);
      // Use the publishPresence function returned from usePresence
      publishPresence(data);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set presence';
      setError(errorMessage);
      console.error('Error setting presence:', err);
    }
  }, [publishPresence]);

  // Clear presence
  const clearPresence = useCallback(() => {
    try {
      setError(null);
      // Publish empty object to clear presence
      publishPresence({});
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear presence';
      setError(errorMessage);
      console.error('Error clearing presence:', err);
    }
  }, [publishPresence]);

  // Process connected users
  const connectedUsers: Record<string, PresenceData> = {};
  const connectedPlayers: PresenceData[] = [];
  const connectedSpectators: PresenceData[] = [];

  // Add current user if connected
  if (user && user.name && user.role && user.userId) {
    const userData: PresenceData = {
      name: user.name as string,
      role: user.role as 'player' | 'spectator',
      userId: user.userId as string,
    };
    connectedUsers[user.userId as string] = userData;
    
    if (userData.role === 'player') {
      connectedPlayers.push(userData);
    } else {
      connectedSpectators.push(userData);
    }
  }

  // Add peers
  Object.entries(peers || {}).forEach(([peerId, peerData]) => {
    if (peerData && peerData.name && peerData.role && peerData.userId) {
      const userData: PresenceData = {
        name: peerData.name as string,
        role: peerData.role as 'player' | 'spectator',
        userId: peerData.userId as string,
      };
      connectedUsers[peerData.userId as string] = userData;
      
      if (userData.role === 'player') {
        connectedPlayers.push(userData);
      } else {
        connectedSpectators.push(userData);
      }
    }
  });

  const totalConnected = Object.keys(connectedUsers).length;

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected && publishPresence) {
        try {
          publishPresence({});
        } catch (err) {
          console.error('Error clearing presence on unmount:', err);
        }
      }
    };
  }, [isConnected, publishPresence]);

  return {
    isConnected,
    setPresence,
    clearPresence,
    connectedUsers,
    connectedPlayers,
    connectedSpectators,
    totalConnected,
    isLoading,
    error,
  };
}

/**
 * Hook for checking if a specific user is connected
 */
export function useUserPresence(roomId: string, userId: string): boolean {
  const { connectedUsers } = usePresence(roomId);
  return userId in connectedUsers;
}

/**
 * Hook for getting connection count by role
 */
export function usePresenceCount(roomId: string): {
  players: number;
  spectators: number;
  total: number;
} {
  const { connectedPlayers, connectedSpectators, totalConnected } = usePresence(roomId);
  
  return {
    players: connectedPlayers.length,
    spectators: connectedSpectators.length,
    total: totalConnected,
  };
}