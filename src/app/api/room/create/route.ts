import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import type { CreateRoomRequest, GameState, RoomSettings, Cell } from '@/types/game';

// Validation constants
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const MIN_BOARD_SIZE = 3;
const MAX_BOARD_SIZE = 10;
const MAX_ROOM_NAME_LENGTH = 50;

// Player colors for the game
const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
];

function validateRoomSettings(settings: RoomSettings): string | null {
  if (settings.maxPlayers < MIN_PLAYERS || settings.maxPlayers > MAX_PLAYERS) {
    return `Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`;
  }

  if (settings.boardSize.rows < MIN_BOARD_SIZE || settings.boardSize.rows > MAX_BOARD_SIZE) {
    return `Board rows must be between ${MIN_BOARD_SIZE} and ${MAX_BOARD_SIZE}`;
  }

  if (settings.boardSize.cols < MIN_BOARD_SIZE || settings.boardSize.cols > MAX_BOARD_SIZE) {
    return `Board columns must be between ${MIN_BOARD_SIZE} and ${MAX_BOARD_SIZE}`;
  }

  if (settings.gameTimeLimit && settings.gameTimeLimit < 60) {
    return 'Game time limit must be at least 60 seconds';
  }

  if (settings.moveTimeLimit && settings.moveTimeLimit < 5) {
    return 'Move time limit must be at least 5 seconds';
  }

  return null;
}

function createInitialGrid(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      // Calculate critical mass based on position
      let criticalMass = 4; // Center cells
      
      // Corner cells
      if ((row === 0 || row === rows - 1) && (col === 0 || col === cols - 1)) {
        criticalMass = 2;
      }
      // Edge cells (not corners)
      else if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        criticalMass = 3;
      }
      
      grid[row][col] = {
        orbs: 0,
        ownerId: undefined,
        criticalMass,
      };
    }
  }
  
  return grid;
}

function createInitialGameState(settings: RoomSettings, hostId: string, hostName: string): GameState {
  return {
    grid: createInitialGrid(settings.boardSize.rows, settings.boardSize.cols),
    players: [{
      id: hostId,
      name: hostName,
      color: PLAYER_COLORS[0],
      orbCount: 0,
      isEliminated: false,
      isConnected: true,
    }],
    currentPlayerId: hostId,
    moveCount: 0,
    turnStartedAt: Date.now(),
    status: 'lobby',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomRequest & { hostId: string; hostName: string } = await request.json();
    
    // Validate required fields
    if (!body.name || !body.settings || !body.hostId || !body.hostName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, settings, hostId, hostName' },
        { status: 400 }
      );
    }

    // Validate room name
    if (body.name.length > MAX_ROOM_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Room name must be ${MAX_ROOM_NAME_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate room settings
    const settingsError = validateRoomSettings(body.settings);
    if (settingsError) {
      return NextResponse.json(
        { success: false, error: settingsError },
        { status: 400 }
      );
    }

    // Create initial game state
    const gameState = createInitialGameState(body.settings, body.hostId, body.hostName);
    
    // Generate unique room ID
    const roomId = crypto.randomUUID();
    
    // Create room in database
    await adminDb.transact(
      adminDb.tx.rooms[roomId].update({
        name: body.name,
        status: 'lobby',
        hostId: body.hostId,
        gameState,
        settings: body.settings,
        history: [],
        createdAt: Date.now(),
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        id: roomId,
        name: body.name,
        hostId: body.hostId,
        gameState,
        settings: body.settings,
        status: 'lobby',
        history: [],
        createdAt: Date.now(),
      },
    });

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}