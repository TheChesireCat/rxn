import { SessionManager, type RoomSession } from './sessionManager';
import type { Room, User, ApiResponse } from '@/types/game';

export interface ReconnectionInfo {
  canReconnect: boolean;
  room?: Room;
  userRole?: 'player' | 'spectator';
  reason?: string;
}

/**
 * Check if user can reconnect to their active room
 */
export async function checkReconnectionStatus(userId: string): Promise<ReconnectionInfo> {
  const activeRoom = SessionManager.getActiveRoom();
  
  if (!activeRoom) {
    return {
      canReconnect: false,
      reason: 'No active room found',
    };
  }

  try {
    // Fetch current room state
    const response = await fetch(`/api/room/${activeRoom.roomId}`);
    const result: ApiResponse<Room> = await response.json();

    if (!result.success || !result.data) {
      // Room no longer exists
      SessionManager.clearActiveRoom();
      return {
        canReconnect: false,
        reason: 'Room no longer exists',
      };
    }

    const room = result.data;

    // Check if room is still active or in lobby
    if (room.status === 'finished') {
      SessionManager.clearActiveRoom();
      return {
        canReconnect: false,
        reason: 'Game has finished',
      };
    }

    // Check if user is still in the room
    const isPlayerInRoom = room.gameState.players.some(player => player.id === userId);
    
    if (activeRoom.role === 'player' && !isPlayerInRoom) {
      SessionManager.clearActiveRoom();
      return {
        canReconnect: false,
        reason: 'User is no longer in the game',
      };
    }

    // User can reconnect
    return {
      canReconnect: true,
      room,
      userRole: activeRoom.role,
    };

  } catch (error) {
    console.error('Error checking reconnection status:', error);
    return {
      canReconnect: false,
      reason: 'Failed to check room status',
    };
  }
}

/**
 * Attempt to reconnect user to their active room
 */
export async function attemptReconnection(userId: string): Promise<ReconnectionInfo> {
  const reconnectionInfo = await checkReconnectionStatus(userId);
  
  if (!reconnectionInfo.canReconnect || !reconnectionInfo.room) {
    return reconnectionInfo;
  }

  try {
    // If user was a player, try to rejoin as player
    if (reconnectionInfo.userRole === 'player') {
      const response = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: reconnectionInfo.room.id,
          userId,
          rejoin: true,
        }),
      });

      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        // If can't rejoin as player, try as spectator
        return await attemptSpectatorReconnection(userId, reconnectionInfo.room);
      }
    }

    // Update session with successful reconnection
    SessionManager.storeActiveRoom({
      roomId: reconnectionInfo.room.id,
      roomName: reconnectionInfo.room.name,
      joinedAt: Date.now(),
      role: reconnectionInfo.userRole || 'spectator',
    });

    return reconnectionInfo;

  } catch (error) {
    console.error('Error during reconnection:', error);
    return {
      canReconnect: false,
      reason: 'Failed to reconnect to room',
    };
  }
}

/**
 * Attempt to reconnect as spectator if player reconnection fails
 */
async function attemptSpectatorReconnection(userId: string, room: Room): Promise<ReconnectionInfo> {
  try {
    const response = await fetch('/api/room/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: room.id,
        userId,
        asSpectator: true,
      }),
    });

    const result: ApiResponse = await response.json();
    
    if (result.success) {
      // Update session as spectator
      SessionManager.storeActiveRoom({
        roomId: room.id,
        roomName: room.name,
        joinedAt: Date.now(),
        role: 'spectator',
      });

      return {
        canReconnect: true,
        room,
        userRole: 'spectator',
      };
    }

    return {
      canReconnect: false,
      reason: 'Failed to join as spectator',
    };

  } catch (error) {
    console.error('Error joining as spectator:', error);
    return {
      canReconnect: false,
      reason: 'Failed to join as spectator',
    };
  }
}

/**
 * Get reconnection prompt message for UI
 */
export function getReconnectionMessage(reconnectionInfo: ReconnectionInfo): string {
  if (!reconnectionInfo.canReconnect) {
    return reconnectionInfo.reason || 'Cannot reconnect to previous game';
  }

  const room = reconnectionInfo.room!;
  const role = reconnectionInfo.userRole === 'player' ? 'player' : 'spectator';
  
  if (room.status === 'lobby') {
    return `Rejoin "${room.name}" lobby as ${role}?`;
  } else {
    return `Reconnect to ongoing game "${room.name}" as ${role}?`;
  }
}

/**
 * Clean up expired room sessions
 */
export function cleanupExpiredSessions(): void {
  const session = SessionManager.getSession();
  if (!session) {
    SessionManager.clearActiveRoom();
    return;
  }

  // If session is valid but very old, clear active room
  const activeRoom = SessionManager.getActiveRoom();
  if (activeRoom) {
    const timeSinceJoin = Date.now() - activeRoom.joinedAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (timeSinceJoin > maxAge) {
      SessionManager.clearActiveRoom();
    }
  }
}