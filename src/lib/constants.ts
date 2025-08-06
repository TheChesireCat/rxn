/**
 * Shared game constants
 */

// Player colors for the game - vibrant, distinct colors
export const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
] as const;

// Maximum number of players supported
export const MAX_PLAYERS = PLAYER_COLORS.length;

// Game configuration constants
export const GAME_CONFIG = {
  MAX_USERNAME_LENGTH: 30,
  MAX_EXPLOSION_WAVES: 1000,
  MIN_PLAYERS_TO_START: 2,
} as const;
