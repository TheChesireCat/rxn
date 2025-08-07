import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import { createEmptyGrid } from '@/lib/gameLogic';
import { PLAYER_COLORS } from '@/lib/constants';
import type { ApiResponse, GameState } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId } = body;

    // Validate required fields
    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roomId, userId' } as ApiResponse,
        { status: 400 }
      );
    }

    // Fetch current room state
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } }
      }
    });

    const room = roomQuery.rooms[0];
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify that the requester is the host
    if (room.hostId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the room host can restart the game' } as ApiResponse,
        { status: 403 }
      );
    }

    // Check if game is finished
    if (room.gameState.status !== 'finished' && room.gameState.status !== 'runaway') {
      return NextResponse.json(
        { success: false, error: 'Game must be finished to restart' } as ApiResponse,
        { status: 400 }
      );
    }

    // Keep the same players but reset their states
    const resetPlayers = room.gameState.players.map((player: any, index: number) => ({
      ...player,
      isEliminated: false,
      orbCount: 0,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length], // Keep same colors
    }));

    // Create a new game state with the same settings but reset board
    const newGameState: GameState = {
      grid: createEmptyGrid(room.gameState.grid.length, room.gameState.grid[0].length),
      players: resetPlayers,
      currentPlayerId: resetPlayers[0].id, // Start with first player
      status: 'active',
      moveCount: 0,
      turnStartedAt: Date.now(),
      winner: null,
    };

    // Update the room with the new game state
    await db.transact(
      db.tx.rooms[roomId].update({
        gameState: newGameState,
        status: 'active',
        // Keep other settings like grid size, time limits, etc.
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        gameState: newGameState,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error restarting game:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}