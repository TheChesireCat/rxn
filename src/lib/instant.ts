import { init } from '@instantdb/react';
import schema from '../../instant.schema';

// Initialize InstantDB with schema and proper configuration
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error('NEXT_PUBLIC_INSTANT_APP_ID environment variable is required');
}

export const db = init({
  appId: APP_ID,
  schema,
});

// Export types for use throughout the application
export type { AppSchema } from '../../instant.schema';

// Import game types
import type { GameState, RoomSettings } from '../types/game';

// Utility functions for database operations
export const createRoom = (roomData: {
  name: string;
  hostId: string;
  gameState: GameState;
  settings: RoomSettings;
}) => {
  return db.transact(
    db.tx.rooms[crypto.randomUUID()].update({
      ...roomData,
      status: 'lobby',
      history: [],
      createdAt: Date.now(),
    })
  );
};

export const createUser = (userData: {
  name: string;
}) => {
  return db.transact(
    db.tx.users[crypto.randomUUID()].update({
      ...userData,
      wins: 0,
      gamesPlayed: 0,
      createdAt: Date.now(),
    })
  );
};

export const createChatMessage = (messageData: {
  roomId: string;
  userId: string;
  text: string;
}) => {
  return db.transact(
    db.tx.chatMessages[crypto.randomUUID()].update({
      ...messageData,
      createdAt: Date.now(),
    }).link({ room: messageData.roomId })
  );
};

// Room management utilities
export const getRoomById = (roomId: string) => {
  return db.useQuery({
    rooms: {
      $: { where: { id: roomId } },
      messages: {}
    }
  });
};

export const getUserRooms = (userId: string) => {
  return db.useQuery({
    rooms: {
      $: { where: { hostId: userId } }
    }
  });
};

// Room utilities for presence and topics
export const getGameRoom = (roomId: string) => {
  return db.room("gameRoom", roomId);
};