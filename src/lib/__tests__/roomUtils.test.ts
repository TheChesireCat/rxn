import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRoomUrl,
  generateRoomUrlWithName,
  extractRoomIdFromUrl,
  isValidRoomId,
  isValidRoomName,
  sanitizeRoomName,
  generateRoomCode,
  createRoomInvitation,
  parseRoomParams,
  checkRoomJoinability,
  generateRoomMetadata,
} from '../roomUtils';

describe('Room URL Utilities', () => {
  const mockRoomId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRoomName = 'Test Game Room';

  describe('generateRoomUrl', () => {
    it('should generate correct room URL', () => {
      const url = generateRoomUrl(mockRoomId);
      expect(url).toMatch(new RegExp(`/room/${mockRoomId}$`));
    });
  });

  describe('generateRoomUrlWithName', () => {
    it('should generate URL with encoded room name', () => {
      const url = generateRoomUrlWithName(mockRoomId, mockRoomName);
      expect(url).toMatch(new RegExp(`/room/${mockRoomId}\\?name=Test%20Game%20Room$`));
    });
  });

  describe('extractRoomIdFromUrl', () => {
    it('should extract room ID from valid URL', () => {
      const url = `http://localhost:3000/room/${mockRoomId}`;
      const extractedId = extractRoomIdFromUrl(url);
      expect(extractedId).toBe(mockRoomId);
    });

    it('should extract room ID from URL with query params', () => {
      const url = `http://localhost:3000/room/${mockRoomId}?name=test`;
      const extractedId = extractRoomIdFromUrl(url);
      expect(extractedId).toBe(mockRoomId);
    });

    it('should return null for invalid URL format', () => {
      const url = 'http://localhost:3000/invalid/path';
      const extractedId = extractRoomIdFromUrl(url);
      expect(extractedId).toBeNull();
    });

    it('should return null for invalid room ID', () => {
      const url = 'http://localhost:3000/room/invalid-id';
      const extractedId = extractRoomIdFromUrl(url);
      expect(extractedId).toBeNull();
    });
  });

  describe('isValidRoomId', () => {
    it('should validate correct UUID format', () => {
      expect(isValidRoomId(mockRoomId)).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidRoomId('invalid-id')).toBe(false);
      expect(isValidRoomId('123')).toBe(false);
      expect(isValidRoomId('')).toBe(false);
      expect(isValidRoomId('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // too short
    });

    it('should handle null and undefined', () => {
      expect(isValidRoomId(null as any)).toBe(false);
      expect(isValidRoomId(undefined as any)).toBe(false);
    });
  });

  describe('isValidRoomName', () => {
    it('should validate correct room names', () => {
      expect(isValidRoomName('Test Room')).toBe(true);
      expect(isValidRoomName('Game-123')).toBe(true);
      expect(isValidRoomName('My_Game!')).toBe(true);
    });

    it('should reject invalid room names', () => {
      expect(isValidRoomName('')).toBe(false);
      expect(isValidRoomName('a'.repeat(51))).toBe(false); // too long
      expect(isValidRoomName('Test<script>')).toBe(false); // invalid characters
    });

    it('should handle null and undefined', () => {
      expect(isValidRoomName(null as any)).toBe(false);
      expect(isValidRoomName(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeRoomName', () => {
    it('should sanitize room names correctly', () => {
      expect(sanitizeRoomName('Test Room')).toBe('test-room');
      expect(sanitizeRoomName('My Game!!!')).toBe('my-game');
      expect(sanitizeRoomName('  Spaced  Out  ')).toBe('spaced-out');
    });
  });

  describe('generateRoomCode', () => {
    it('should generate 8-character uppercase code', () => {
      const code = generateRoomCode(mockRoomId);
      expect(code).toBe('123E4567');
      expect(code).toHaveLength(8);
    });
  });

  describe('createRoomInvitation', () => {
    it('should create complete invitation object', () => {
      const invitation = createRoomInvitation(mockRoomId, mockRoomName);
      
      expect(invitation.roomId).toBe(mockRoomId);
      expect(invitation.roomName).toBe(mockRoomName);
      expect(invitation.roomCode).toBe('123E4567');
      expect(invitation.fullUrl).toMatch(new RegExp(`/room/${mockRoomId}\\?name=`));
      expect(invitation.shortUrl).toMatch(new RegExp(`/room/${mockRoomId}$`));
      expect(invitation.shareText).toContain(mockRoomName);
      expect(invitation.shareText).toContain('123E4567');
    });
  });

  describe('parseRoomParams', () => {
    it('should parse room parameters from URLSearchParams', () => {
      const params = new URLSearchParams('name=Test%20Room&code=ABC123');
      const parsed = parseRoomParams(params);
      
      expect(parsed.roomName).toBe('Test Room');
      expect(parsed.inviteCode).toBe('ABC123');
    });

    it('should handle missing parameters', () => {
      const params = new URLSearchParams('');
      const parsed = parseRoomParams(params);
      
      expect(parsed.roomName).toBeUndefined();
      expect(parsed.inviteCode).toBeUndefined();
    });
  });
});

describe('Room Joinability Logic', () => {
  const mockGameState = {
    players: [
      { id: 'player1', isEliminated: false },
      { id: 'player2', isEliminated: false },
    ],
    status: 'lobby',
  };

  const mockSettings = {
    maxPlayers: 4,
  };

  describe('checkRoomJoinability', () => {
    it('should allow joining as player in lobby with space', () => {
      const result = checkRoomJoinability(mockGameState, mockSettings);
      
      expect(result.canJoinAsPlayer).toBe(true);
      expect(result.canJoinAsSpectator).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should only allow spectator when room is full', () => {
      const fullGameState = {
        ...mockGameState,
        players: [
          { id: 'player1', isEliminated: false },
          { id: 'player2', isEliminated: false },
          { id: 'player3', isEliminated: false },
          { id: 'player4', isEliminated: false },
        ],
      };

      const result = checkRoomJoinability(fullGameState, mockSettings);
      
      expect(result.canJoinAsPlayer).toBe(false);
      expect(result.canJoinAsSpectator).toBe(true);
      expect(result.reason).toBe('Room is full');
    });

    it('should only allow spectator when game is active', () => {
      const activeGameState = {
        ...mockGameState,
        status: 'active',
      };

      const result = checkRoomJoinability(activeGameState, mockSettings);
      
      expect(result.canJoinAsPlayer).toBe(false);
      expect(result.canJoinAsSpectator).toBe(true);
      expect(result.reason).toBe('Game is already in progress');
    });

    it('should only allow spectator when game is finished', () => {
      const finishedGameState = {
        ...mockGameState,
        status: 'finished',
      };

      const result = checkRoomJoinability(finishedGameState, mockSettings);
      
      expect(result.canJoinAsPlayer).toBe(false);
      expect(result.canJoinAsSpectator).toBe(true);
      expect(result.reason).toBe('Game has finished');
    });

    it('should handle existing player correctly', () => {
      const result = checkRoomJoinability(mockGameState, mockSettings, 'player1');
      
      expect(result.canJoinAsPlayer).toBe(true);
      expect(result.canJoinAsSpectator).toBe(true);
    });

    it('should handle eliminated existing player', () => {
      const gameStateWithEliminated = {
        ...mockGameState,
        players: [
          { id: 'player1', isEliminated: true },
          { id: 'player2', isEliminated: false },
        ],
      };

      const result = checkRoomJoinability(gameStateWithEliminated, mockSettings, 'player1');
      
      expect(result.canJoinAsPlayer).toBe(false);
      expect(result.canJoinAsSpectator).toBe(true);
    });
  });
});

describe('Room Metadata Generation', () => {
  const mockGameState = {
    players: [
      { id: 'player1', isEliminated: false },
      { id: 'player2', isEliminated: false },
    ],
    status: 'lobby',
  };

  const mockSettings = {
    maxPlayers: 4,
  };

  describe('generateRoomMetadata', () => {
    it('should generate correct metadata for lobby', () => {
      const metadata = generateRoomMetadata('Test Room', mockGameState, mockSettings);
      
      expect(metadata.title).toBe('Chain Reaction - Test Room');
      expect(metadata.description).toContain('Test Room');
      expect(metadata.playerCount).toBe('2/4');
      expect(metadata.status).toBe('Waiting for players');
    });

    it('should generate correct metadata for active game', () => {
      const activeGameState = { ...mockGameState, status: 'active' };
      const metadata = generateRoomMetadata('Test Room', activeGameState, mockSettings);
      
      expect(metadata.status).toBe('Game in progress');
    });

    it('should generate correct metadata for finished game', () => {
      const finishedGameState = { ...mockGameState, status: 'finished' };
      const metadata = generateRoomMetadata('Test Room', finishedGameState, mockSettings);
      
      expect(metadata.status).toBe('Game finished');
    });
  });
});