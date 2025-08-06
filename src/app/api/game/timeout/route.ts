import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import { checkTimeouts, handleMoveTimeout } from '@/lib/gameLogic';
import { GameState, ApiResponse } from '@/types/game';

interface TimeoutRequest {
  roomId: string;
  type: 'game' | 'move';
}

export async function POST(request: NextRequest) {
  try {
    const body: TimeoutRequest = await request.json();
    const { roomId, type } = body;

    // Validate request body
    if (!roomId || !type || !['game', 'move'].includes(type)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid request: roomId and type (game|move) are required'
      }, { status: 400 });
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

    // Only process timeouts for active games
    if (gameState.status !== 'active') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Game is not active'
      }, { status: 400 });
    }

    // Check for timeouts
    const timeoutCheck = checkTimeouts(
      gameState,
      settings,
      room.createdAt
    );

    let newGameState: GameState;
    let message: string;

    if (type === 'game' && timeoutCheck.isGameTimeout && timeoutCheck.winner) {
      // Handle game timeout
      newGameState = {
        ...gameState,
        status: 'finished',
        winner: timeoutCheck.winner
      };
      message = 'Game timed out. Winner determined by highest orb count.';

    } else if (type === 'move' && timeoutCheck.isMoveTimeout) {
      // Handle move timeout
      newGameState = handleMoveTimeout(gameState);
      message = 'Move timed out. Turn has been skipped.';

    } else {
      // No timeout detected
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `No ${type} timeout detected`
      }, { status: 400 });
    }

    // Update database with timeout result
    try {
      await db.transact(
        db.tx.rooms[roomId].update({
          gameState: newGameState,
          status: newGameState.status
        })
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          gameState: newGameState,
          message
        }
      });

    } catch (dbError) {
      console.error('Database transaction failed:', dbError);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to update game state'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Timeout processing error:', error);
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