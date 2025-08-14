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

    // Enhanced user profiles (was 'users', keeping same name for compatibility)
    users: i.entity({
      // Existing fields
      name: i.string().unique(),
      wins: i.number(),
      gamesPlayed: i.number(),
      createdAt: i.number(),

      // NEW: Authentication fields
      authUserId: i.string().unique().indexed().optional(), // Links to $users.id when claimed
      email: i.string().unique().indexed().optional(), // Email when claimed
      nameClaimedAt: i.number().optional(), // When username was registered

      // NEW: Enhanced stats (initialize to 0 in code, not schema)
      totalOrbs: i.number().optional(),
      longestStreak: i.number().optional(),
      winRate: i.number().optional(),
      totalChainReactions: i.number().optional(),
      highestPlacement: i.number().optional(),

      // NEW: Activity tracking
      lastPlayedAt: i.number().optional(),
      lastActiveRoomId: i.string().optional(),
      sessionCount: i.number().optional(),

      // NEW: Profile customization (for claimed users)
      avatar: i.string().optional(), // Emoji or future avatar URL
      favoriteColor: i.string().optional(),
      bio: i.string().optional(),

      // NEW: Metadata
      updatedAt: i.number().optional(),
    }),

    // NEW: Track individual game results
    gameResults: i.entity({
      playerId: i.string().indexed(),
      playerName: i.string(), // Store name in case player deletes account
      roomId: i.string().indexed(),
      roomName: i.string(),
      placement: i.number(), // 1st, 2nd, etc.
      orbsPlaced: i.number(),
      cellsCaptured: i.number(),
      chainReactions: i.number(),
      longestChain: i.number(),
      eliminated: i.boolean(),
      gameLength: i.number(), // seconds
      playedAt: i.number(),
    }),

    // NEW: Reserved names to prevent impersonation
    reservedNames: i.entity({
      name: i.string().unique().indexed(),
      reason: i.string(), // 'system', 'offensive', 'admin', etc.
      createdAt: i.number(),
    }),

    // Existing: Game rooms with complete state and settings
    rooms: i.entity({
      name: i.string(),
      status: i.string(), // 'lobby' | 'active' | 'finished' | 'runaway'
      hostId: i.string(),
      gameState: i.any(), // Complex nested object for game state
      settings: i.any(), // Complex nested object for room settings
      history: i.any(), // Array of previous game states for undo
      createdAt: i.number(),
    }),

    // Existing: Chat messages for in-game communication
    chatMessages: i.entity({
      roomId: i.string(),
      userId: i.string(),
      text: i.string(),
      createdAt: i.number(),
    }),

    // Existing: Emoji reactions for games
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
    // Existing: Link chat messages to rooms
    roomMessages: {
      forward: { on: "rooms", has: "many", label: "messages" },
      reverse: { on: "chatMessages", has: "one", label: "room" }
    },

    // Existing: Link reactions to rooms
    roomReactions: {
      forward: { on: "rooms", has: "many", label: "reactions" },
      reverse: { on: "reactions", has: "one", label: "room" }
    },

    // NEW: Link users to auth
    userAuth: {
      forward: { on: "users", has: "one", label: "authUser" },
      reverse: { on: "$users", has: "one", label: "profile" }
    },

    // NEW: Link game results to users
    userGameResults: {
      forward: { on: "users", has: "many", label: "gameResults" },
      reverse: { on: "gameResults", has: "one", label: "user" }
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
