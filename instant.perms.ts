import type { InstantRules } from "@instantdb/react";

// Simplified permissions for development - allowing all operations
// TODO: Re-enable strict permissions for production when auth is properly implemented
const rules = {
  // Allow all operations on all entities for development
  users: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    }
  },

  rooms: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    }
  },

  chatMessages: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    }
  },

  reactions: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    }
  },

  $files: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    }
  }
} satisfies InstantRules;

export default rules;
