import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    // Built-in entities for file uploads and users
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    
    // User profiles and statistics
    users: i.entity({
      name: i.string().unique(),
      wins: i.number(),
      gamesPlayed: i.number(),
      createdAt: i.number(),
    }),
    
    // Game rooms with complete state and settings
    rooms: i.entity({
      name: i.string(),
      status: i.string(), // 'lobby' | 'active' | 'finished' | 'runaway'
      hostId: i.string(),
      gameState: i.any(), // Complex nested object for game state
      settings: i.any(), // Complex nested object for room settings
      history: i.any(), // Array of previous game states for undo
      createdAt: i.number(),
    }),
    
    // Chat messages for in-game communication
    chatMessages: i.entity({
      roomId: i.string(),
      userId: i.string(),
      text: i.string(),
      createdAt: i.number(),
    }),
    
    // Emoji reactions for games
    reactions: i.entity({
      roomId: i.string(),
      userId: i.string(),
      userName: i.string(),
      emoji: i.string(),
      x: i.number().optional(), // Position on screen (percentage)
      y: i.number().optional(), // Position on screen (percentage)
      createdAt: i.number(),
    }),
  },
  
  links: {
    // Link chat messages to rooms
    roomMessages: {
      forward: { on: "rooms", has: "many", label: "messages" },
      reverse: { on: "chatMessages", has: "one", label: "room" }
    },
    
    // Link reactions to rooms
    roomReactions: {
      forward: { on: "rooms", has: "many", label: "reactions" },
      reverse: { on: "reactions", has: "one", label: "room" }
    }
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;