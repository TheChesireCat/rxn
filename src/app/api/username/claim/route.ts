import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';
import type { ApiResponse, User } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const { username, authUserId, email } = await request.json();
    
    if (!username || !authUserId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    // Get existing user record
    const userQuery = await db.query({
      users: {
        $: { where: { name: username } }
      }
    });
    
    const user = userQuery.users[0];
    if (!user) {
      // If user doesn't exist, create a new one
      const newUserId = crypto.randomUUID();
      const now = Date.now();
      
      await db.transact([
        db.tx.users[newUserId].update({
          name: username,
          authUserId,
          email,
          wins: 0,
          gamesPlayed: 0,
          createdAt: now,
          nameClaimedAt: now,
          lastPlayedAt: now,
          sessionCount: 1,
        }),
        // Create bidirectional link between $users and users
        db.tx.users[newUserId].link({ authUser: authUserId }),
        db.tx.$users[authUserId].link({ profile: newUserId })
      ]);
      
      const userData: User = {
        id: newUserId,
        name: username,
        email,
        wins: 0,
        gamesPlayed: 0,
        createdAt: now,
        authUserId,
        nameClaimedAt: now,
        isClaimed: true,
      };
      
      return NextResponse.json({
        success: true,
        user: userData,
      } as ApiResponse<User>);
    }
    
    // Check if already claimed
    if ((user as any).authUserId) {
      return NextResponse.json(
        { success: false, error: 'Username already claimed' } as ApiResponse,
        { status: 409 }
      );
    }
    
    // Claim the username by linking to auth user
    await db.transact([
      db.tx.users[user.id].update({
        authUserId,
        email,
        nameClaimedAt: Date.now(),
        updatedAt: Date.now(),
      }),
      // Create bidirectional link between $users and users
      db.tx.users[user.id].link({ authUser: authUserId }),
      db.tx.$users[authUserId].link({ profile: user.id })
    ]);
    
    const userData: User = {
      id: user.id,
      name: user.name,
      email,
      wins: user.wins || 0,
      gamesPlayed: user.gamesPlayed || 0,
      createdAt: user.createdAt,
      authUserId,
      nameClaimedAt: Date.now(),
      isClaimed: true,
    };
    
    return NextResponse.json({
      success: true,
      user: userData,
    } as ApiResponse<User>);
    
  } catch (error) {
    console.error('Claim username error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim username' } as ApiResponse,
      { status: 500 }
    );
  }
}
