import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import type { ApiResponse, User } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, authUserId } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' } as ApiResponse,
        { status: 400 }
      );
    }

    if (!authUserId || typeof authUserId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Auth user ID is required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Method 1: Try to find user by authUserId (most reliable)
    let query = await db.query({
      users: {
        $: { where: { authUserId } }
      }
    });

    let userProfile = query.users[0];

    // Method 2: If not found by authUserId, try by email
    if (!userProfile) {
      query = await db.query({
        users: {
          $: { where: { email } }
        }
      });
      userProfile = query.users[0];
    }

    // Method 3: If still not found, try through the $users relationship
    if (!userProfile) {
      const authQuery = await db.query({
        $users: {
          $: { where: { id: authUserId } },
          profile: {}
        }
      });

      if (authQuery.$users[0]?.profile) {
        userProfile = authQuery.$users[0].profile;
      }
    }

    if (!userProfile) {
      // No existing game profile found
      return NextResponse.json(
        { success: false, error: 'User profile not found. Please create a new account.' } as ApiResponse,
        { status: 404 }
      );
    }
    
    // Update last played time
    await db.transact([
      db.tx.users[userProfile.id].update({
        lastPlayedAt: Date.now(),
        sessionCount: (userProfile.sessionCount || 0) + 1,
        updatedAt: Date.now(),
        // Update authUserId and email if they were missing
        ...((!userProfile.authUserId && authUserId) ? { authUserId } : {}),
        ...((!userProfile.email && email) ? { email } : {}),
      })
    ]);

    // If the user didn't have an authUser link, create it now
    if (!userProfile.authUserId && authUserId) {
      await db.transact([
        db.tx.users[userProfile.id].link({ authUser: authUserId }),
        db.tx.$users[authUserId].link({ profile: userProfile.id })
      ]);
    }

    // Return user data for session
    const userData: User = {
      id: userProfile.id,
      name: userProfile.name,
      wins: userProfile.wins || 0,
      gamesPlayed: userProfile.gamesPlayed || 0,
      createdAt: userProfile.createdAt,
      authUserId: authUserId,
      email: email,
      nameClaimedAt: userProfile.nameClaimedAt,
      isClaimed: true,
    };

    return NextResponse.json({
      success: true,
      user: userData,
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user profile' } as ApiResponse,
      { status: 500 }
    );
  }
}
