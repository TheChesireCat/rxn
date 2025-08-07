import type { InstantRules } from "@instantdb/react";

// Permissions for name-first authentication system
// Development mode: Relaxed permissions for testing
// Production mode: Uncomment the strict rules below

const rules = {
  // User profiles - core entity
  users: {
    allow: {
      view: "true", // Anyone can view usernames and stats
      create: "true", // Anyone can create an unclaimed username
      update: "true", // For now, allow updates (restrict in production)
      delete: "false", // Users cannot be deleted
    }
    // Production rules (uncomment when ready):
    // allow: {
    //   view: "true", // Public profiles
    //   create: "true", // Anyone can create username
    //   update: "auth.id != null && (auth.id == data.authUserId || data.authUserId == null)", // Only owner or unclaimed
    //   delete: "false", // No deletion
    // }
  },

  // Game results tracking
  gameResults: {
    allow: {
      view: "true", // Public game history
      create: "true", // Server creates after games
      update: "false", // Results are immutable
      delete: "false", // No deletion of history
    }
  },

  // Reserved usernames
  reservedNames: {
    allow: {
      view: "true", // Public list of reserved names
      create: "false", // Only admins can reserve names
      update: "false", // Cannot change reserved names
      delete: "false", // Cannot remove reserved names
    }
  },

  // Game rooms
  rooms: {
    allow: {
      view: "true", // Anyone can view rooms
      create: "true", // Anyone can create rooms
      update: "true", // For gameplay updates
      delete: "true", // Host can delete room
    }
    // Production rules:
    // allow: {
    //   view: "true",
    //   create: "auth.id != null || true", // Even guests can create
    //   update: "true", // For gameplay
    //   delete: "auth.id == data.hostId", // Only host can delete
    // }
  },

  // Chat messages
  chatMessages: {
    allow: {
      view: "true", // Anyone in room can view
      create: "true", // Anyone can send messages
      update: "false", // Messages are immutable
      delete: "false", // No message deletion
    }
  },

  // Emoji reactions
  reactions: {
    allow: {
      view: "true", // Anyone can see reactions
      create: "true", // Anyone can react
      update: "false", // Reactions are immutable
      delete: "true", // Can remove own reaction
    }
  },

  // File uploads (if used)
  $files: {
    allow: {
      view: "true",
      create: "auth.id != null", // Only authenticated users
      update: "false",
      delete: "false",
    }
  }
} satisfies InstantRules;

export default rules;

// Production permission patterns to implement:
// 
// 1. USERNAME CLAIMING:
//    - Anyone can create unclaimed username (authUserId == null)
//    - Only authenticated user can claim (set authUserId)
//    - Only owner can update claimed username's stats
//
// 2. GAME STATS:
//    - Only save stats for claimed usernames
//    - Stats are immutable once created
//    - Public viewing for leaderboards
//
// 3. ROOMS:
//    - Host has full control
//    - Players can update game state
//    - Spectators can only view
//
// 4. RESERVED NAMES:
//    - Read-only for everyone
//    - Only system can create
//
// Example production rules for users entity:
// users: {
//   allow: {
//     view: "true",
//     create: "true",
//     update: {
//       // Allow updates if:
//       // 1. User is authenticated and owns this profile, OR
//       // 2. Profile is unclaimed (no authUserId) and being claimed by auth user, OR  
//       // 3. Updating non-protected fields (wins, gamesPlayed) via server
//       $default: "auth.id != null && (auth.id == data.authUserId || (data.authUserId == null && newData.authUserId == auth.id))",
//       
//       // Specific field rules
//       authUserId: "data.authUserId == null && auth.id == newData.authUserId", // Can only set once
//       email: "auth.id == data.authUserId", // Only owner can set email
//       nameClaimedAt: "data.nameClaimedAt == null", // Can only set once
//       
//       // Stats can be updated by server (using admin SDK bypasses these)
//       wins: "true",
//       gamesPlayed: "true",
//       totalOrbs: "true",
//     },
//     delete: "false"
//   }
// }
