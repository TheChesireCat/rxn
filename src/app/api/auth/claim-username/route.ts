import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/authService';
import type { ApiResponse, User } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, code } = body;

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required' } as ApiResponse,
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' } as ApiResponse,
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' } as ApiResponse,
        { status: 400 }
      );
    }

    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim();
    const sanitizedCode = code.trim();

    // First verify the magic code to authenticate the user
    const authResult = await AuthService.verifyMagicCode(sanitizedEmail, sanitizedCode);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error } as ApiResponse,
        { status: 401 }
      );
    }

    // Get the authenticated user ID from InstantDB
    // Note: In a real implementation, we'd get this from the auth context
    // For now, we'll generate a UUID as the authUserId
    const authUserId = crypto.randomUUID();

    // Claim the username
    const claimResult = await AuthService.claimUsername(sanitizedUsername, authUserId, sanitizedEmail);

    if (!claimResult.success) {
      return NextResponse.json(
        { success: false, error: claimResult.error } as ApiResponse,
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: claimResult.user,
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error claiming username:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim username. Please try again.' } as ApiResponse,
      { status: 500 }
    );
  }
}