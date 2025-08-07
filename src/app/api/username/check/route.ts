import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';

// List of reserved usernames
const RESERVED_NAMES = [
  'admin', 'administrator', 'root', 'system', 'moderator', 'mod',
  'support', 'help', 'info', 'contact', 'team', 'staff',
  'chainreaction', 'rxn', 'game', 'server', 'host', 'player',
  'guest', 'anonymous', 'user', 'test', 'demo',
];

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const normalizedName = username.toLowerCase().trim();

    // Check if it's a reserved name
    if (RESERVED_NAMES.includes(normalizedName)) {
      return NextResponse.json({
        available: false,
        reason: 'reserved',
        message: 'This username is reserved'
      });
    }

    // Check if username exists in database
    const userQuery = await db.query({
      users: {
        $: { where: { name: username } }
      }
    });

    if (userQuery.users.length > 0) {
      const existingUser = userQuery.users[0];
      
      // Check if it's claimed (has authUserId)
      const isClaimed = !!(existingUser as any).authUserId;
      
      // Check if it's recently active (for unclaimed names)
      const lastPlayedAt = (existingUser as any).lastPlayedAt || existingUser.createdAt;
      const isActive = Date.now() - lastPlayedAt < 30 * 60 * 1000; // 30 minutes

      return NextResponse.json({
        available: false,
        isClaimed,
        isActive: !isClaimed && isActive,
        lastActive: lastPlayedAt,
        email: isClaimed ? (existingUser as any).email : undefined,
        message: isClaimed 
          ? 'This username is registered. Sign in to use it.'
          : isActive 
            ? 'This username is currently in use.'
            : 'This username can be claimed.'
      });
    }

    // Username is available
    return NextResponse.json({
      available: true,
      message: 'Username is available'
    });

  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
