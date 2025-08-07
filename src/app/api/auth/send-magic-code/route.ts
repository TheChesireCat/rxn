import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/game';

// This route is deprecated - magic code sending should happen on client side
// using db.auth.sendMagicCode() directly in AuthService
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'This endpoint is deprecated. Use client-side magic code sending.' } as ApiResponse,
    { status: 410 }
  );
}