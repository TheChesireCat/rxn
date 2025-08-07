'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/instant';

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  createdAt: number;
}

interface UseChatOptions {
  roomId: string | null | undefined;
  enabled?: boolean;
}

export function useChat({ roomId, enabled = true }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only query when we have a valid roomId and it's enabled
  const shouldQuery = enabled && !!roomId;
  
  const { data, isLoading: queryLoading, error: queryError } = db.useQuery(
    shouldQuery
      ? {
          chatMessages: {
            $: {
              where: { roomId: roomId },
              order: { createdAt: 'asc' }
            }
          }
        }
      : {}
  );

  // Update messages when data changes
  useEffect(() => {
    if (shouldQuery && data?.chatMessages) {
      setMessages(data.chatMessages);
      setIsLoading(false);
      setError(null);
      
      console.log('[useChat] Messages updated:', {
        roomId,
        count: data.chatMessages.length,
        messages: data.chatMessages
      });
    } else if (shouldQuery && !queryLoading && !data?.chatMessages) {
      setMessages([]);
      setIsLoading(false);
      console.log('[useChat] No messages found for room:', roomId);
    } else if (!shouldQuery) {
      setMessages([]);
      setIsLoading(false);
    }
  }, [data, shouldQuery, roomId, queryLoading]);

  // Handle errors
  useEffect(() => {
    if (queryError) {
      console.error('[useChat] Query error:', queryError);
      setError(queryError.message || 'Failed to load messages');
      setIsLoading(false);
    }
  }, [queryError]);

  // Send a message
  const sendMessage = async (text: string, userId: string) => {
    if (!roomId || !text.trim()) {
      throw new Error('Invalid message or room');
    }

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId,
          text: text.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      console.log('[useChat] Message sent:', result);
      return result;
    } catch (error) {
      console.error('[useChat] Failed to send message:', error);
      throw error;
    }
  };

  return {
    messages,
    isLoading: shouldQuery ? queryLoading : false,
    error,
    sendMessage,
    refresh: () => {
      // InstantDB handles real-time updates automatically
      console.log('[useChat] Refresh requested for room:', roomId);
    }
  };
}
