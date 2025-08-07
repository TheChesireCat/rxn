'use client';

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/instant';

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  createdAt: number;
}

interface UseUnreadMessagesOptions {
  roomId: string | null | undefined;
  currentUserId: string;
  isChatOpen: boolean;
}

export function useUnreadMessages({ roomId, currentUserId, isChatOpen }: UseUnreadMessagesOptions) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(0);

  // Storage key for last seen timestamp
  const storageKey = `chat-last-seen-${roomId}-${currentUserId}`;

  // Load last seen timestamp from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (!isNaN(timestamp)) {
          setLastSeenTimestamp(timestamp);
        }
      }
    }
  }, [storageKey, roomId]);

  // Query messages (using the same approach as ChatModal)
  const { data: chatData } = db.useQuery({
    chatMessages: {}
  });

  // Filter and count unread messages
  useEffect(() => {
    if (!chatData?.chatMessages || !roomId) {
      setUnreadCount(0);
      return;
    }

    // Filter messages for this room (same logic as ChatModal)
    const roomMessages = (chatData.chatMessages as ChatMessage[])
      .filter(msg => msg.roomId === roomId)
      .sort((a, b) => a.createdAt - b.createdAt);

    // If chat is open, auto-mark any new messages as read
    if (isChatOpen && roomMessages.length > 0) {
      const latestMessage = roomMessages[roomMessages.length - 1];
      if (latestMessage.createdAt > lastSeenTimestamp) {
        const now = Date.now();
        setLastSeenTimestamp(now);
        localStorage.setItem(storageKey, now.toString());
        console.log('[useUnreadMessages] Auto-marked new messages as read (chat open):', {
          roomId,
          timestamp: now,
          latestMessageTime: latestMessage.createdAt
        });
      }
    }

    // Count unread messages (newer than lastSeenTimestamp and not from current user)
    const unreadMessages = roomMessages.filter(msg => 
      msg.createdAt > lastSeenTimestamp && 
      msg.userId !== currentUserId
    );

    setUnreadCount(unreadMessages.length);

    // Log for debugging
    if (unreadMessages.length > 0 && !isChatOpen) {
      console.log('[useUnreadMessages] Found unread messages:', {
        roomId,
        unreadCount: unreadMessages.length,
        lastSeenTimestamp,
        isChatOpen,
        unreadMessages
      });
    }
  }, [chatData?.chatMessages, roomId, lastSeenTimestamp, currentUserId, isChatOpen, storageKey]);

  // Mark messages as read when chat is opened
  const markAsRead = useCallback(() => {
    if (!roomId || typeof window === 'undefined') return;

    const now = Date.now();
    setLastSeenTimestamp(now);
    setUnreadCount(0);

    // Persist to localStorage
    localStorage.setItem(storageKey, now.toString());

    console.log('[useUnreadMessages] Marked messages as read:', {
      roomId,
      timestamp: now
    });
  }, [roomId, storageKey]);

  // Auto-mark as read when chat opens
  useEffect(() => {
    if (isChatOpen) {
      markAsRead();
    }
  }, [isChatOpen, markAsRead]);

  return {
    unreadCount,
    markAsRead
  };
}
