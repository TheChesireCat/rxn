'use client';

import { useState, useCallback } from 'react';
import type { Reaction } from '@/components/ReactionOverlay';

interface UseReactionsProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
}

interface UseReactionsReturn {
  reactions: Reaction[];
  sendReaction: (emoji: string, x?: number, y?: number) => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing emoji reactions in the game room.
 * 
 * NOTE: This is a simplified implementation that stores reactions locally.
 * The full real-time implementation using InstantDB topics is pending.
 * This prevents the app from crashing while the feature is being developed.
 */
export function useReactions({ 
  roomId, 
  currentUserId, 
  currentUserName 
}: UseReactionsProps): UseReactionsReturn {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send a reaction (local only for now)
  const sendReaction = useCallback((emoji: string, x?: number, y?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const reaction: Reaction = {
        id: `${currentUserId}-${Date.now()}`,
        emoji,
        senderId: currentUserId,
        senderName: currentUserName,
        timestamp: Date.now(),
        x,
        y,
      };

      // Add reaction locally
      setReactions(prev => [...prev, reaction]);

      // Auto-remove reaction after 3 seconds
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3000);

      // TODO: Implement real-time sync with InstantDB topics when API is finalized
      console.log('Reaction sent (local only):', reaction);
      
    } catch (err) {
      console.error('Error sending reaction:', err);
      setError('Failed to send reaction');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, currentUserName]);

  return {
    reactions,
    sendReaction,
    isLoading,
    error,
  };
}

/**
 * Future implementation notes:
 * 
 * InstantDB topics API for real-time reactions:
 * 1. Use room.useTopics() or similar API to get topic functions
 * 2. Subscribe to 'reactions' topic for receiving reactions from other players
 * 3. Publish to 'reactions' topic when sending a reaction
 * 
 * The exact API depends on InstantDB's topics implementation:
 * - Might use room.subscribeTopics() and room.publishTopic()
 * - Or might use a hook pattern like useTopics() that returns functions
 * - Check InstantDB documentation for the latest API
 */