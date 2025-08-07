'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/instant';
import type { Reaction } from '@/components/ReactionOverlay';

interface UseReactionsProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
}

interface UseReactionsReturn {
  reactions: Reaction[];
  sendReaction: (emoji: string, x?: number, y?: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing emoji reactions in the game room with real-time synchronization.
 * Note: The ReactionOverlay component handles the display duration (3 seconds) for reactions.
 */
export function useReactions({ 
  roomId, 
  currentUserId, 
  currentUserName 
}: UseReactionsProps): UseReactionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query reactions for this room
  // We'll let the ReactionOverlay component handle filtering and lifecycle
  const { data: reactionData, isLoading: queryLoading } = db.useQuery({
    reactions: {
      $: {
        where: {
          roomId: roomId
        }
      }
    }
  });

  // Convert database reactions to component format
  // Only include recent reactions (last 15 seconds to be safe)
  const reactions: Reaction[] = [];
  
  if (reactionData?.reactions) {
    const now = Date.now();
    const cutoff = now - 15000; // 15 seconds ago (generous buffer)
    
    reactionData.reactions.forEach(reaction => {
      if (reaction.createdAt > cutoff) {
        reactions.push({
          id: reaction.id,
          emoji: reaction.emoji,
          senderId: reaction.userId,
          senderName: reaction.userName,
          timestamp: reaction.createdAt,
          x: reaction.x,
          y: reaction.y,
        });
      }
    });
  }

  // Send a reaction
  const sendReaction = useCallback(async (emoji: string, x?: number, y?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add reaction to database
      await db.transact(
        db.tx.reactions[crypto.randomUUID()].update({
          roomId,
          userId: currentUserId,
          userName: currentUserName,
          emoji,
          x: x ?? Math.random() * 80 + 10, // 10-90% if not specified
          y: y ?? Math.random() * 80 + 10, // 10-90% if not specified
          createdAt: Date.now(),
        })
      );

      // Note: Real-time updates will happen automatically via InstantDB
      console.log('Reaction sent:', { emoji, roomId });
      
    } catch (err) {
      console.error('Error sending reaction:', err);
      setError('Failed to send reaction');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, currentUserId, currentUserName]);

  return {
    reactions,
    sendReaction,
    isLoading: isLoading || queryLoading,
    error,
  };
}
