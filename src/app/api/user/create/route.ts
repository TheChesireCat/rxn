import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import type { ApiResponse, User } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, authUserId, email } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingQuery = await db.query({
      users: {
        $: { where: { name } }
      }
    });

    if (existingQuery.users.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username is already taken' } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate unique ID for the game user
    const userId = crypto.randomUUID();
    const now = Date.now();

    // Create the user with optional auth linking
    const userTransactions = [
      db.tx.users[userId].update({
        name,
        wins: 0,
        gamesPlayed: 0,
        createdAt: now,
        lastPlayedAt: now,
        sessionCount: 1,
        ...(authUserId && email ? {
          authUserId,
          email,
          nameClaimedAt: now,
        } : {})
      })
    ];

    // If this is a claimed user (has authUserId), link to the $users entity
    if (authUserId) {
      // Link the game user to the auth user
      userTransactions.push(
        db.tx.users[userId].link({ authUser: authUserId })
      );
      
      // Also link the auth user's profile to this game user
      userTransactions.push(
        db.tx.$users[authUserId].link({ profile: userId })
      );
    }

    await db.transact(userTransactions);

    // Return user data for session
    const userData: User = {
      id: userId,
      name,
      wins: 0,
      gamesPlayed: 0,
      createdAt: now,
      isClaimed: !!authUserId,
      authUserId,
      email,
      nameClaimedAt: authUserId ? now : undefined,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('unique') || error.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken' } as ApiResponse,
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create user' } as ApiResponse,
      { status: 500 }
    );
  }
}
