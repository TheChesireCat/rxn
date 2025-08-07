import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import type { ApiResponse, User } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Sanitize username
    const sanitizedName = name.trim().slice(0, 50);
    if (sanitizedName.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 1 character' } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingQuery = await db.query({
      users: {
        $: { where: { name: sanitizedName } }
      }
    });

    if (existingQuery.users.length > 0) {
      const existingUser = existingQuery.users[0];
      
      // Update last played time for returning unclaimed user
      await db.transact([
        db.tx.users[existingUser.id].update({
          lastPlayedAt: Date.now(),
          sessionCount: (existingUser.sessionCount || 0) + 1,
          updatedAt: Date.now(),
        })
      ]);

      // Return existing user data
      const userData: User = {
        id: existingUser.id,
        name: existingUser.name,
        wins: existingUser.wins || 0,
        gamesPlayed: existingUser.gamesPlayed || 0,
        createdAt: existingUser.createdAt,
      };

      return NextResponse.json({
        success: true,
        data: userData,
      } as ApiResponse<User>);
    }

    // Generate unique user ID
    const userId = crypto.randomUUID();
    const now = Date.now();

    // Create new unclaimed user in database
    await db.transact([
      db.tx.users[userId].update({
        name: sanitizedName,
        wins: 0,
        gamesPlayed: 0,
        totalOrbs: 0,
        longestStreak: 0,
        winRate: 0,
        totalChainReactions: 0,
        sessionCount: 1,
        lastPlayedAt: now,
        createdAt: now,
        updatedAt: now,
      })
    ]);

    // Create user data for session
    const userData: User = {
      id: userId,
      name: sanitizedName,
      wins: 0,
      gamesPlayed: 0,
      createdAt: now,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error creating user session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user session' } as ApiResponse,
      { status: 500 }
    );
  }
}
