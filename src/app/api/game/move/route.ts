import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import { processMove, checkTimeouts, handleMoveTimeout } from '@/lib/gameLogic';
import { GameState, MoveRequest, ApiResponse } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body: MoveRequest = await request.json();
    const { roomId, row, col } = body;

    // Validate request body
    if (!roomId || typeof row !== 'number' || typeof col !== 'number') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid request: roomId, row, and col are required'
      }, { status: 400 });
    }

    // Get player ID from session/auth (for now using a placeholder)
    // TODO: Replace with actual session management
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

    // Check for timeouts before processing move
    const timeoutCheck = checkTimeouts(
      gameState,
      settings,
      room.createdAt
    );

    let currentGameState = gameState;

    // Handle game timeout
    if (timeoutCheck.isGameTimeout && timeoutCheck.winner) {
      const timedOutGameState: GameState = {
        ...gameState,
        status: 'finished',
        winner: timeoutCheck.winner
      };

      // Update database with timeout result
      await db.transact(
        db.tx.rooms[roomId].update({
          gameState: timedOutGameState,
          status: timedOutGameState.status
        })
      );

      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Game has timed out. Winner determined by highest orb count.',
        data: { gameState: timedOutGameState }
      }, { status: 400 });
    }

    // Handle move timeout
    if (timeoutCheck.isMoveTimeout) {
      currentGameState = handleMoveTimeout(gameState);
      
      // If the timed-out player was the one trying to move, reject the move
      if (gameState.currentPlayerId === playerId) {
        await db.transact(
          db.tx.rooms[roomId].update({
            gameState: currentGameState
          })
        );

        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Your turn has timed out and been skipped',
          data: { gameState: currentGameState }
        }, { status: 400 });
      }
    }

    // Process the move
    const moveResult = processMove(currentGameState, playerId, row, col);

    if (!moveResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: moveResult.error
      }, { status: 400 });
    }

    const newGameState = moveResult.newGameState!;

    // Prepare history entry for undo functionality
    const historyEntry = {
      gameState: currentGameState,
      timestamp: Date.now(),
      playerId,
      move: { row, col }
    };

    // Update room history (keep last 10 moves for undo)
    const currentHistory = Array.isArray(room.history) ? room.history : [];
    const newHistory = [...currentHistory, historyEntry].slice(-10);

    // Perform atomic database update
    try {
      await db.transact(
        db.tx.rooms[roomId].update({
          gameState: newGameState,
          history: newHistory,
          status: newGameState.status
        })
      );

      // Handle runaway chain reaction
      if (moveResult.isRunaway) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            gameState: newGameState,
            isRunaway: true,
            message: 'Runaway chain reaction detected! Game ended.'
          }
        });
      }

      // Return successful move result
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          gameState: newGameState,
          explosionWaves: moveResult.isRunaway ? 'runaway' : 'normal'
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
    console.error('Move processing error:', error);
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