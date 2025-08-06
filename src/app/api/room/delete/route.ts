import { adminDb as db } from '@/lib/admin';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/game';

export async function DELETE(request: NextRequest) {
  try {
    const { roomId, userId } = await request.json();

    if (!roomId || !userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Room ID and User ID are required' },
        { status: 400 }
      );
    }

    // Fetch the room data to check if the user is the host
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } },
      },
    });

    const room = roomQuery.rooms[0];

    if (!room) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if the user is the host
    if (room.hostId !== userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only the host can delete the room' },
        { status: 403 }
      );
    }

    // Delete related chat messages first
    const messagesQuery = await db.query({
      chatMessages: {
        $: { where: { roomId } },
      },
    });

    // Delete each message individually
    if (messagesQuery.chatMessages && messagesQuery.chatMessages.length > 0) {
      const messageDeleteTxs = messagesQuery.chatMessages.map(msg => 
        db.tx.chatMessages[msg.id].delete()
      );
      await db.transact(messageDeleteTxs);
    }

    // Delete the room
    await db.transact(
      db.tx.rooms[roomId].delete()
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Room deleted successfully' },
    });

  } catch (error) {
    console.error('[DELETE_ROOM] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete room' },
      { status: 500 }
    );
  }
}