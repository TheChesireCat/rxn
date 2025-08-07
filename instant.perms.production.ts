import type { InstantRules } from "@instantdb/react";

// Production-ready permissions for name-first authentication
// Protects auth fields while allowing gameplay

const rules = {
  // User profiles with authentication
  users: {
    allow: {
      // Anyone can view profiles (for leaderboards)
      view: "true",
      
      // Anyone can create a username (starts unclaimed)
      create: "true",
      
      // Complex update rules based on auth state and ownership
      update: {
        // Default: Allow if user owns the profile OR profile is unclaimed
        $default: "(auth.id != null && auth.id == data.authUserId) || data.authUserId == null",
        
        // Auth fields - strict protection
        authUserId: "data.authUserId == null && auth.id != null", // Can only set once when claiming
        email: "auth.id != null && auth.id == data.authUserId", // Only owner can update email
        nameClaimedAt: "data.nameClaimedAt == null", // Can only set once
        
        // Game stats - allow updates (server uses admin SDK anyway)
        wins: "true",
        gamesPlayed: "true", 
        totalOrbs: "true",
        winRate: "true",
        longestStreak: "true",
        totalChainReactions: "true",
        
        // Activity tracking - always allowed
        lastPlayedAt: "true",
        sessionCount: "true",
        lastActiveRoomId: "true",
        
        // Profile customization - only for claimed users
        avatar: "auth.id != null && auth.id == data.authUserId",
        favoriteColor: "auth.id != null && auth.id == data.authUserId",
        bio: "auth.id != null && auth.id == data.authUserId",
      },
      
      // No deletion of users
      delete: "false",
    }
  },

  // Game results - immutable history
  gameResults: {
    allow: {
      view: "true", // Public game history
      create: "true", // Created after each game
      update: "false", // Results cannot be changed
      delete: "false", // History is permanent
    }
  },

  // Reserved usernames - read-only
  reservedNames: {
    allow: {
      view: "true", // Public list
      create: "false", // Only via admin SDK
      update: "false", // Cannot modify
      delete: "false", // Cannot remove
    }
  },

  // Game rooms - host control with player access
  rooms: {
    allow: {
      view: "true", // Anyone can view rooms
      create: "true", // Anyone can create rooms
      
      update: {
        // Anyone can update game state during play
        $default: "true",
        
        // Only host can change settings
        settings: "data.hostId == auth.id || data.hostId == auth.email",
        hostId: "data.hostId == auth.id || data.hostId == auth.email",
      },
      
      // Only host can delete room
      delete: "data.hostId == auth.id || data.hostId == auth.email",
    }
  },

  // Chat messages - create-only
  chatMessages: {
    allow: {
      view: "true", // Anyone can read
      create: "true", // Anyone can send
      update: "false", // No editing
      delete: "false", // No deletion
    }
  },

  // Emoji reactions
  reactions: {
    allow: {
      view: "true", // Anyone can see
      create: "true", // Anyone can react
      update: "false", // No editing
      delete: "data.userId == auth.id || data.userId == auth.email", // Can remove own reactions
    }
  },

  // File uploads (future feature)
  $files: {
    allow: {
      view: "true",
      create: "auth.id != null", // Only authenticated
      update: "false",
      delete: "auth.id != null && auth.id == data.uploaderId",
    }
  }
} satisfies InstantRules;

export default rules;
