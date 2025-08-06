import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import type { JoinRoomRequest, Player } from '@/types/game';
import { PLAYER_COLORS, GAME_CONFIG } from '@/lib/constants';

const { MAX_USERNAME_LENGTH } = GAME_CONFIG;

export async function POST(request: NextRequest) {
  try {
    const body: JoinRoomRequest & { userId: string } = await request.json();
    
    // Validate required fields
    if (!body.roomId || !body.userName || !body.userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roomId, userName, userId' },
        { status: 400 }
      );
    }

    // Validate username
    if (body.userName.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Fetch current room state
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: body.roomId } }
      }
    });

    const room = roomQuery.rooms[0];
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const gameState = room.gameState;
    const settings = room.settings;

    // Check if user is already in the room
    const existingPlayer = gameState.players.find((p: Player) => p.id === body.userId);
    if (existingPlayer) {
      // Update player name and connection status
      existingPlayer.name = body.userName;
      existingPlayer.isConnected = true;
      
      // Update room in database
      await db.transact(
        db.tx.rooms[body.roomId].update({
          gameState: {
            ...gameState,
            players: gameState.players,
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          roomId: body.roomId,
          room,
          playerRole: 'player',
          playerId: body.userId,
        },
      });
    }

    // Check room capacity for new players
    const activePlayers = gameState.players.filter((p: Player) => !p.isEliminated);
    
    if (activePlayers.length >= settings.maxPlayers) {
      // Room is full, join as spectator
      return NextResponse.json({
        success: true,
        data: {
          roomId: body.roomId,
          room,
          playerRole: 'spectator',
          playerId: body.userId,
          spectatorReason: 'room_full',
        },
      });
    }

    // Check if game is already active (can only join as spectator)
    if (gameState.status === 'active' || gameState.status === 'finished') {
      return NextResponse.json({
        success: true,
        data: {
          roomId: body.roomId,
          room,
          playerRole: 'spectator',
          playerId: body.userId,
          spectatorReason: 'game_active',
        },
      });
    }

    // Add new player to the room
    const playerColor = PLAYER_COLORS[activePlayers.length % PLAYER_COLORS.length];
    const newPlayer: Player = {
      id: body.userId,
      name: body.userName,
      color: playerColor,
      orbCount: 0,
      isEliminated: false,
      isConnected: true,
    };

    const updatedPlayers = [...gameState.players, newPlayer];
    
    // Update room in database
    await db.transact(
      db.tx.rooms[body.roomId].update({
        gameState: {
          ...gameState,
          players: updatedPlayers,
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        roomId: body.roomId,
        room: {
          ...room,
          gameState: {
            ...gameState,
            players: updatedPlayers,
          }
        },
        playerRole: 'player',
        playerId: body.userId,
      },
    });

  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}