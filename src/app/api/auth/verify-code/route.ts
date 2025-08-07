import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/game';

// This route is deprecated - magic code verification should happen on client side
// using db.auth.signInWithMagicCode(), then call /api/auth/get-user-profile
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'This endpoint is deprecated. Use client-side magic code verification.' } as ApiResponse,
    { status: 410 }
  );
}