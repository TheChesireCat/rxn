import type { InstantRules } from "@instantdb/react";

// Server-authoritative permissions for the Chain Reaction game
// These rules ensure that game state can only be modified through server API endpoints
const rules = {
  // File upload permissions (for future avatar features)
  $files: {
    allow: {
      view: "true",
      create: "isOwner",
      update: "isOwner", 
      delete: "isOwner",
    },
    bind: ["isOwner", "auth.id != null && data.path.startsWith(auth.id + '/')"]
  },

  // User profiles - users can only modify their own profiles
  users: {
    allow: {
      view: "true",
      create: "isOwner",
      update: "isOwner",
      delete: "false", // Never allow user deletion
    },
    bind: ["isOwner", "auth.id != null && auth.id == data.id"]
  },

  // Game rooms - server-authoritative model
  rooms: {
    allow: {
      view: "true", // Anyone can view room state
      create: "auth.id != null", // Authenticated users can create rooms
      update: "false", // NO direct updates - only through API endpoints
      delete: "isHost", // Only room host can delete
    },
    bind: ["isHost", "auth.id != null && auth.id == data.hostId"]
  },

  // Chat messages - users can create and delete their own messages
  chatMessages: {
    allow: {
      view: "true", // Anyone in room can view messages
      create: "isAuthor", // Users can create messages
      update: "false", // Messages cannot be edited
      delete: "isAuthor", // Users can delete their own messages
    },
    bind: ["isAuthor", "auth.id != null && auth.id == data.userId"]
  }
} satisfies InstantRules;

export default rules;