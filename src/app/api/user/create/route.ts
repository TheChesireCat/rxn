import { NextRequest, NextResponse } from 'next/server';
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

    // Generate unique user ID
    const userId = crypto.randomUUID();

    // Create temporary user session data
    // Note: For temporary sessions, we don't persist to database immediately
    // The user will be persisted when they join a room or game
    const userData: User = {
      id: userId,
      name: sanitizedName,
      wins: 0,
      gamesPlayed: 0,
      createdAt: Date.now(),
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