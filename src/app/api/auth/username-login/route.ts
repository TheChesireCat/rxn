import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/authService';
import { usernameLoginLimiter, getClientIP, createRateLimitHeaders } from '@/lib/rateLimiter';
import type { ApiResponse } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = usernameLoginLimiter.check(clientIP);
    
    if (!rateLimitResult.allowed) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please wait before trying again.' } as ApiResponse,
        { status: 429, headers }
      );
    }

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
    if (sanitizedUsername.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' } as ApiResponse,
        { status: 400 }
      );
    }

    // Check username availability and get email if claimed
    const availability = await AuthService.checkUsernameAvailability(sanitizedUsername);
    
    if (availability.available) {
      // Username is available for claiming
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json({
        success: true,
        data: {
          needsEmail: true,
          isClaimed: false,
          message: 'Username is available for claiming',
        },
      } as ApiResponse, { headers });
    }

    if (availability.isClaimed && availability.email) {
      // Username is claimed, send magic code to associated email
      const magicCodeResult = await AuthService.sendMagicCodeToEmail(availability.email);
      
      if (!magicCodeResult.success) {
        return NextResponse.json(
          { success: false, error: magicCodeResult.error } as ApiResponse,
          { status: 500 }
        );
      }

      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json({
        success: true,
        data: {
          needsEmail: false,
          isClaimed: true,
          email: availability.email,
          message: 'Verification code sent to your email',
        },
      } as ApiResponse, { headers });
    }

    // Username exists but is not claimed (active unclaimed user)
    return NextResponse.json(
      { 
        success: false, 
        error: availability.reason || 'Username is currently in use. Try another.' 
      } as ApiResponse,
      { status: 409 }
    );

  } catch (error) {
    console.error('Error in username login:', error);
    return NextResponse.json(
      { success: false, error: 'System temporarily unavailable. Please try again.' } as ApiResponse,
      { status: 500 }
    );
  }
}