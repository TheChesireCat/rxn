import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/authService';
import type { ApiResponse } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required' } as ApiResponse,
        { status: 400 }
      );
    }

    const sanitizedUsername = username.trim();
    
    // Check username availability
    const availability = await AuthService.checkUsernameAvailability(sanitizedUsername);

    return NextResponse.json({
      success: true,
      data: {
        available: availability.available,
        isClaimed: availability.isClaimed,
        isActive: availability.isActive,
        reason: availability.reason,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { success: false, error: 'System temporarily unavailable. Please try again.' } as ApiResponse,
      { status: 500 }
    );
  }
}