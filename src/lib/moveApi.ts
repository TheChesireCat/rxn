import { MoveRequest, ApiResponse, GameState } from '@/types/game';

/**
 * Submit a move to the server
 */
export async function submitMove(
  moveRequest: MoveRequest,
  playerId: string
): Promise<{ gameState: GameState; isRunaway?: boolean; message?: string }> {
  const response = await fetch('/api/game/move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-player-id': playerId,
    },
    body: JSON.stringify(moveRequest),
  });

  const result: ApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to submit move');
  }

  return result.data as { gameState: GameState; isRunaway?: boolean; message?: string };
}

/**
 * Handle move submission with error handling and retries
 */
export async function handleMoveSubmission(
  moveRequest: MoveRequest,
  playerId: string,
  maxRetries: number = 2
): Promise<{ gameState: GameState; isRunaway?: boolean; message?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await submitMove(moveRequest, playerId);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to submit move after retries');
}

/**
 * Submit an undo request to the server
 */
export async function submitUndo(
  roomId: string,
  playerId: string
): Promise<{ gameState: GameState; message?: string }> {
  const response = await fetch('/api/game/undo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-player-id': playerId,
    },
    body: JSON.stringify({ roomId }),
  });

  const result: ApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to undo move');
  }

  return result.data as { gameState: GameState; message?: string };
}

/**
 * Handle undo submission with error handling
 */
export async function handleUndoSubmission(
  roomId: string,
  playerId: string
): Promise<{ gameState: GameState; message?: string }> {
  try {
    return await submitUndo(roomId, playerId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to undo move';
    throw new Error(errorMessage);
  }
}