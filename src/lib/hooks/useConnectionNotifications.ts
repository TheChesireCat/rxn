'use client';

import { useState, useEffect, useRef } from 'react';

interface ConnectionNotification {
  id: string;
  playerName: string;
  isOnline: boolean;
  timestamp: number;
}

interface UseConnectionNotificationsProps {
  connectedUsers: Record<string, { name: string; userId: string }>;
  players: Array<{ id: string; name: string }>;
  currentUserId: string;
}

export function useConnectionNotifications({
  connectedUsers,
  players,
  currentUserId
}: UseConnectionNotificationsProps) {
  const [notifications, setNotifications] = useState<ConnectionNotification[]>([]);
  const previousConnectionsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const currentConnections = new Set(Object.keys(connectedUsers));
    const previousConnections = previousConnectionsRef.current;

    // Skip notifications on initial load
    if (!isInitializedRef.current) {
      previousConnectionsRef.current = currentConnections;
      isInitializedRef.current = true;
      return;
    }

    // Find players who went offline
    const wentOffline = Array.from(previousConnections).filter(
      userId => !currentConnections.has(userId) && userId !== currentUserId
    );

    // Find players who came online
    const cameOnline = Array.from(currentConnections).filter(
      userId => !previousConnections.has(userId) && userId !== currentUserId
    );

    // Create notifications for offline players
    wentOffline.forEach(userId => {
      const player = players.find(p => p.id === userId);
      if (player) {
        const notification: ConnectionNotification = {
          id: `${userId}-offline-${Date.now()}`,
          playerName: player.name,
          isOnline: false,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
      }
    });

    // Create notifications for online players
    cameOnline.forEach(userId => {
      const player = players.find(p => p.id === userId);
      if (player) {
        const notification: ConnectionNotification = {
          id: `${userId}-online-${Date.now()}`,
          playerName: player.name,
          isOnline: true,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
      }
    });

    // Update previous connections
    previousConnectionsRef.current = currentConnections;
  }, [connectedUsers, players, currentUserId]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    dismissNotification
  };
}