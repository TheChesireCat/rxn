// Core game state types
export interface Cell {
  orbs: number;
  ownerId?: string;
  criticalMass: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  orbCount: number;
  isEliminated: boolean;
  isConnected: boolean;
}

export interface GameState {
  grid: Cell[][];
  players: Player[];
  currentPlayerId: string;
  moveCount: number;
  turnStartedAt: number;
  status: 'lobby' | 'active' | 'finished' | 'runaway';
  winner?: string;
}

export interface RoomSettings {
  maxPlayers: number;
  boardSize: { rows: number; cols: number };
  gameTimeLimit?: number;
  moveTimeLimit?: number;
  undoEnabled: boolean;
  isPrivate: boolean;
}

export interface Room {
  id: string;
  name: string;
  status: string;
  hostId: string;
  gameState: GameState;
  settings: RoomSettings;
  history: unknown[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  wins: number;
  gamesPlayed: number;
  createdAt: number;
}

// Animation types for react-spring
export interface Animation {
  id: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  color: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MoveRequest {
  roomId: string;
  row: number;
  col: number;
}

export interface CreateRoomRequest {
  name: string;
  settings: RoomSettings;
}

export interface JoinRoomRequest {
  roomId: string;
  userName: string;
}