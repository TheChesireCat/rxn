import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import type { ApiResponse } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, hostId } = body;

    // Validate required fields
    if (!roomId || !hostId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roomId, hostId' } as ApiResponse,
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
    if (room.hostId !== hostId) {
      return NextResponse.json(
        { success: false, error: 'Only the room host can start the game' } as ApiResponse,
        { status: 403 }
      );
    }

    // Check if game is in lobby state
    if (room.gameState.status !== 'lobby') {
      return NextResponse.json(
        { success: false, error: 'Game has already started or finished' } as ApiResponse,
        { status: 400 }
      );
    }

    // Check minimum players
    const activePlayers = room.gameState.players.filter((p: { isEliminated: boolean }) => !p.isEliminated);
    if (activePlayers.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Need at least 2 players to start the game' } as ApiResponse,
        { status: 400 }
      );
    }

    // Update game state to active
    const updatedGameState = {
      ...room.gameState,
      status: 'active',
      turnStartedAt: Date.now(),
    };

    await db.transact(
      db.tx.rooms[roomId].update({
        gameState: updatedGameState,
        status: 'active',
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        gameState: updatedGameState,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}