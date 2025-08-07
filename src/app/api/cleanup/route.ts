import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';

// Clean up rooms older than 7 days
const ROOM_EXPIRY_DAYS = 7;
const ROOM_EXPIRY_MS = ROOM_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (optional security check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const cutoffTime = now - ROOM_EXPIRY_MS;

    // Query all rooms to find stale ones
    const roomsQuery = await adminDb.query({
      rooms: {}
    });

    const staleRooms = [];
    const activeRooms = [];

    // Identify stale rooms
    for (const room of roomsQuery.rooms) {
      const roomAge = now - room.createdAt;
      const isStale = room.createdAt < cutoffTime;
      
      // Consider a room stale if:
      // 1. It's older than ROOM_EXPIRY_DAYS
      // 2. OR it's in lobby status and older than 1 day (abandoned lobbies)
      // 3. OR it's finished and older than 1 day
      const isAbandonedLobby = room.gameState?.status === 'lobby' && roomAge > (24 * 60 * 60 * 1000);
      const isOldFinished = room.gameState?.status === 'finished' && roomAge > (24 * 60 * 60 * 1000);
      
      if (isStale || isAbandonedLobby || isOldFinished) {
        staleRooms.push(room);
      } else {
        activeRooms.push(room);
      }
    }

    // Delete stale rooms and their associated data
    const deletedRooms = [];
    for (const room of staleRooms) {
      try {
        // Delete the room (this should cascade to delete associated messages, reactions, etc.)
        await adminDb.transact(
          adminDb.tx.rooms[room.id].delete()
        );
        
        deletedRooms.push({
          id: room.id,
          name: room.name,
          status: room.gameState?.status,
          createdAt: room.createdAt,
          ageInDays: Math.floor((now - room.createdAt) / (24 * 60 * 60 * 1000))
        });
      } catch (error) {
        console.error(`Failed to delete room ${room.id}:`, error);
      }
    }

    // Also clean up any orphaned messages, reactions, or presence data
    // (InstantDB should handle this automatically with proper schema relationships)

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalRoomsChecked: roomsQuery.rooms.length,
        staleRoomsFound: staleRooms.length,
        roomsDeleted: deletedRooms.length,
        activeRoomsRemaining: activeRooms.length,
      },
      deletedRooms: deletedRooms.slice(0, 10), // Limit to first 10 for logging
      criteria: {
        roomExpiryDays: ROOM_EXPIRY_DAYS,
        abandonedLobbyHours: 24,
        finishedGameHours: 24,
      }
    };

    console.log('Cleanup completed:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Cleanup job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cleanup job failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}