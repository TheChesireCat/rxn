import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Fetch room with related chat messages
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } },
        messages: {
          $: { order: { createdAt: 'asc' } }
        }
      }
    });

    const room = roomQuery.rooms[0];
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Calculate additional room statistics
    const gameState = room.gameState;
    const activePlayers = gameState.players.filter((p: { isEliminated: boolean }) => !p.isEliminated);
    const connectedPlayers = gameState.players.filter((p: { isConnected: boolean }) => p.isConnected);
    
    const roomData = {
      ...room,
      stats: {
        totalPlayers: gameState.players.length,
        activePlayers: activePlayers.length,
        connectedPlayers: connectedPlayers.length,
        maxPlayers: room.settings.maxPlayers,
        isFull: activePlayers.length >= room.settings.maxPlayers,
        canJoinAsPlayer: activePlayers.length < room.settings.maxPlayers && 
                        (gameState.status === 'lobby'),
      }
    };

    return NextResponse.json({
      success: true,
      data: roomData,
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add PUT endpoint for updating room settings (host only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required' },
        { status: 400 }
      );
    }

    if (!body.hostId) {
      return NextResponse.json(
        { success: false, error: 'Host ID is required' },
        { status: 400 }
      );
    }

    // Fetch current room to verify host
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } }
      }
    });

    const room = roomQuery.rooms[0];
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Verify that the requester is the host
    if (room.hostId !== body.hostId) {
      return NextResponse.json(
        { success: false, error: 'Only the room host can update settings' },
        { status: 403 }
      );
    }

    // Only allow updates if game is in lobby
    if (room.gameState.status !== 'lobby') {
      return NextResponse.json(
        { success: false, error: 'Cannot update settings after game has started' },
        { status: 400 }
      );
    }

    // Update room settings
    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.settings) updates.settings = { ...room.settings, ...body.settings };

    await db.transact(
      db.tx.rooms[roomId].update(updates)
    );

    // Fetch updated room
    const updatedRoomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRoomQuery.rooms[0],
    });

  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}