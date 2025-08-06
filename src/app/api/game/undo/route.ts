import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import { GameState, ApiResponse } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId } = body;

    // Validate request body
    if (!roomId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid request: roomId is required'
      }, { status: 400 });
    }

    // Get player ID from session/auth
    const playerId = request.headers.get('x-player-id');
    if (!playerId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Player ID required'
      }, { status: 401 });
    }

    // Get current room state from database
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } }
      }
    });

    const room = roomQuery.rooms[0];
    if (!room) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }

    const gameState = room.gameState as GameState;
    const settings = room.settings;
    const history = Array.isArray(room.history) ? room.history : [];

    // Validate undo conditions
    if (!settings.undoEnabled) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Undo is not enabled for this game'
      }, { status: 400 });
    }

    if (gameState.status !== 'active') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Game is not active'
      }, { status: 400 });
    }

    if (gameState.currentPlayerId !== playerId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'You can only undo on your turn'
      }, { status: 400 });
    }

    if (gameState.moveCount === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No moves to undo'
      }, { status: 400 });
    }

    if (history.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No previous game state available'
      }, { status: 400 });
    }

    // Get the most recent history entry
    const lastHistoryEntry = history[history.length - 1] as {
      gameState: GameState;
      timestamp: number;
      playerId: string;
      move: { row: number; col: number };
    };

    // Verify that the last move was made by the current player
    if (lastHistoryEntry.playerId !== playerId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'You can only undo your own moves'
      }, { status: 400 });
    }

    // Restore the previous game state
    const previousGameState = lastHistoryEntry.gameState;
    
    // Update the restored state with current timestamp for turn timing
    const restoredGameState: GameState = {
      ...previousGameState,
      turnStartedAt: Date.now(), // Reset turn timer
    };

    // Remove the last history entry (the move we're undoing)
    const newHistory = history.slice(0, -1);

    // Perform atomic database update
    try {
      await db.transact(
        db.tx.rooms[roomId].update({
          gameState: restoredGameState,
          history: newHistory,
          status: restoredGameState.status
        })
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          gameState: restoredGameState,
          message: 'Move undone successfully'
        }
      });

    } catch (dbError) {
      console.error('Database transaction failed:', dbError);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to undo move'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Undo processing error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}