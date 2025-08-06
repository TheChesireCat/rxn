import { ApiResponse } from '@/types/game';

/**
 * Handle game timeout by calling the server timeout endpoint
 */
export async function handleGameTimeout(roomId: string): Promise<void> {
  try {
    const response = await fetch('/api/game/timeout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        type: 'game'
      }),
    });

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      console.error('Game timeout handling failed:', result.error);
    }
  } catch (error) {
    console.error('Failed to handle game timeout:', error);
  }
}

/**
 * Handle move timeout by calling the server timeout endpoint
 */
export async function handleMoveTimeout(roomId: string): Promise<void> {
  try {
    const response = await fetch('/api/game/timeout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        type: 'move'
      }),
    });

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      console.error('Move timeout handling failed:', result.error);
    }
  } catch (error) {
    console.error('Failed to handle move timeout:', error);
  }
}

/**
 * Calculate time remaining for a timer
 */
export function calculateTimeRemaining(
  startTime: number,
  limitInSeconds: number
): number {
  const now = Date.now();
  const elapsed = now - startTime;
  const totalTime = limitInSeconds * 1000;
  return Math.max(0, totalTime - elapsed);
}

/**
 * Check if a timeout has occurred
 */
export function isTimeoutExpired(
  startTime: number,
  limitInSeconds: number
): boolean {
  return calculateTimeRemaining(startTime, limitInSeconds) === 0;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format time in seconds
 */
export function formatSeconds(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${seconds}s`;
}