'use client';

import React, { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/instant';
import { ReactionPicker } from './ReactionPicker';
import { useReactions } from '@/lib/hooks';

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  createdAt: number;
}

interface ChatPanelProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  players: Array<{ id: string; name: string; color: string }>;
  className?: string;
}

export function ChatPanel({ 
  roomId, 
  currentUserId, 
  currentUserName, 
  players,
  className = '' 
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reactions hook
  const { sendReaction, isLoading: isReactionLoading } = useReactions({
    roomId,
    currentUserId,
    currentUserName,
  });

  // Query chat messages for this room
  const { data, isLoading: messagesLoading, error } = db.useQuery({
    chatMessages: {
      $: { 
        where: { roomId: roomId },  // Explicit roomId binding
        order: { createdAt: 'asc' }
      }
    }
  });

  // Extract messages from query result
  const messages: ChatMessage[] = data?.chatMessages || [];
  
  // Debug logging
  useEffect(() => {
    if (data) {
      console.log('Chat Messages Query Result:', {
        roomId,
        queryData: data,
        messagesFound: data.chatMessages?.length || 0,
        firstMessage: data.chatMessages?.[0],
      });
    }
  }, [data, roomId]);
  
  // Log any query errors
  if (error && Object.keys(error).length > 0) {
    console.error('Error querying chat messages:', error);
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get player name and color by ID
  const getPlayerInfo = (userId: string) => {
    const player = players.find(p => p.id === userId);
    return {
      name: player?.name || 'Unknown Player',
      color: player?.color || '#6B7280'
    };
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          userId: currentUserId,
          text: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Focus back on input after sending
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setMessage(messageText);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
        <div className="flex items-center gap-2">
          {/* Debug button - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                console.log('Testing message creation...');
                const testMsg = `Debug test at ${new Date().toLocaleTimeString()}`;
                try {
                  const response = await fetch('/api/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      roomId,
                      userId: currentUserId,
                      text: testMsg,
                    }),
                  });
                  const result = await response.json();
                  console.log('Debug message result:', result);
                } catch (err) {
                  console.error('Debug message error:', err);
                }
              }}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              title="Send debug message"
            >
              Debug
            </button>
          )}
          <ReactionPicker
            onReactionSelect={(emoji) => sendReaction(emoji)}
            disabled={isReactionLoading}
            className="mr-2"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg: ChatMessage) => {
            const playerInfo = getPlayerInfo(msg.userId);
            const isOwnMessage = msg.userId === currentUserId;
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {!isOwnMessage && (
                    <div 
                      className="text-xs font-medium mb-1"
                      style={{ color: isOwnMessage ? 'rgba(255,255,255,0.8)' : playerInfo.color }}
                    >
                      {playerInfo.name}
                    </div>
                  )}
                  <div className="text-sm break-words">{msg.text}</div>
                  <div 
                    className={`text-xs mt-1 ${
                      isOwnMessage 
                        ? 'text-blue-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={500}
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                     transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {message.length}/500 characters
        </div>
      </form>
    </div>
  );
}