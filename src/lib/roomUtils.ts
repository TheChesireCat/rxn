/**
 * Room URL generation and validation utilities
 */

// Base URL for room sharing (will be set based on environment)
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }
  
  // Server-side
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

/**
 * Generate a shareable URL for a room
 */
export function generateRoomUrl(roomId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/room/${roomId}`;
}

/**
 * Generate a shareable URL with room name for better UX
 */
export function generateRoomUrlWithName(roomId: string, roomName: string): string {
  const baseUrl = getBaseUrl();
  const encodedName = encodeURIComponent(roomName);
  return `${baseUrl}/room/${roomId}?name=${encodedName}`;
}

/**
 * Extract room ID from a room URL
 */
export function extractRoomIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Expected format: /room/{roomId}
    if (pathParts.length >= 3 && pathParts[1] === 'room') {
      const roomId = pathParts[2];
      return isValidRoomId(roomId) ? roomId : null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate if a string is a valid room ID (UUID format)
 */
export function isValidRoomId(roomId: string): boolean {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }
  
  // UUID v4 regex pattern (more flexible to accept any valid UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(roomId);
}

/**
 * Validate room name format
 */
export function isValidRoomName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  // Room name should be 1-50 characters, alphanumeric plus spaces and basic punctuation
  const nameRegex = /^[a-zA-Z0-9\s\-_.,!?()]{1,50}$/;
  return nameRegex.test(name.trim());
}

/**
 * Sanitize room name for URL usage
 */
export function sanitizeRoomName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters except spaces, hyphens, underscores
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase();
}

/**
 * Generate a short, shareable room code (alternative to full URL)
 */
export function generateRoomCode(roomId: string): string {
  // Take first 8 characters of UUID and make uppercase for readability
  return roomId.substring(0, 8).toUpperCase();
}

/**
 * Create a room invitation object with multiple sharing options
 */
export interface RoomInvitation {
  roomId: string;
  roomName: string;
  fullUrl: string;
  shortUrl: string;
  roomCode: string;
  shareText: string;
}

export function createRoomInvitation(roomId: string, roomName: string): RoomInvitation {
  const fullUrl = generateRoomUrlWithName(roomId, roomName);
  const shortUrl = generateRoomUrl(roomId);
  const roomCode = generateRoomCode(roomId);
  const shareText = `Join my Chain Reaction game "${roomName}"! Room code: ${roomCode} or visit: ${shortUrl}`;
  
  return {
    roomId,
    roomName,
    fullUrl,
    shortUrl,
    roomCode,
    shareText,
  };
}

/**
 * Parse room information from URL search params
 */
export function parseRoomParams(searchParams: URLSearchParams): {
  roomName?: string;
  inviteCode?: string;
} {
  return {
    roomName: searchParams.get('name') || undefined,
    inviteCode: searchParams.get('code') || undefined,
  };
}

/**
 * Validate if a room can be joined based on its current state
 */
export interface RoomJoinability {
  canJoinAsPlayer: boolean;
  canJoinAsSpectator: boolean;
  reason?: string;
}

export function checkRoomJoinability(
  gameState: any,
  settings: any,
  userId?: string
): RoomJoinability {
  // Check if user is already in the room
  const existingPlayer = gameState.players.find((p: any) => p.id === userId);
  if (existingPlayer) {
    return {
      canJoinAsPlayer: !existingPlayer.isEliminated,
      canJoinAsSpectator: true,
    };
  }
  
  const activePlayers = gameState.players.filter((p: any) => !p.isEliminated);
  const isFull = activePlayers.length >= settings.maxPlayers;
  const isGameActive = gameState.status === 'active';
  const isGameFinished = gameState.status === 'finished';
  
  if (isGameFinished) {
    return {
      canJoinAsPlayer: false,
      canJoinAsSpectator: true,
      reason: 'Game has finished',
    };
  }
  
  if (isGameActive && !isFull) {
    return {
      canJoinAsPlayer: false,
      canJoinAsSpectator: true,
      reason: 'Game is already in progress',
    };
  }
  
  if (isFull) {
    return {
      canJoinAsPlayer: false,
      canJoinAsSpectator: true,
      reason: 'Room is full',
    };
  }
  
  return {
    canJoinAsPlayer: true,
    canJoinAsSpectator: true,
  };
}

/**
 * Generate room metadata for sharing and SEO
 */
export interface RoomMetadata {
  title: string;
  description: string;
  playerCount: string;
  status: string;
}

export function generateRoomMetadata(
  roomName: string,
  gameState: any,
  settings: any
): RoomMetadata {
  const activePlayers = gameState.players.filter((p: any) => !p.isEliminated);
  const playerCount = `${activePlayers.length}/${settings.maxPlayers}`;
  
  let status = 'Waiting for players';
  if (gameState.status === 'active') {
    status = 'Game in progress';
  } else if (gameState.status === 'finished') {
    status = 'Game finished';
  }
  
  return {
    title: `Chain Reaction - ${roomName}`,
    description: `Join the Chain Reaction game "${roomName}". ${playerCount} players, ${status}.`,
    playerCount,
    status,
  };
}