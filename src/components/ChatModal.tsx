'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ModalBase } from './ModalBase';
import { Send, MessageCircle } from 'lucide-react';


interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  currentUserId: string;
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  players?: Array<{ id: string; userId?: string; name: string; color: string }>;
}

export function ChatModal({
  isOpen,
  onClose,
  messages,
  currentUserId,
  onSendMessage,
  disabled = false,
  players = []
}: ChatModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get username from message using players array
  const getUserName = (msg: any) => {
    // If the message has a userName field, use it
    if (msg.userName) return msg.userName;
    
    // Try to find the player by userId or id
    const player = players.find(p => p.userId === msg.userId || p.id === msg.userId);
    if (player) return player.name;
    
    // Otherwise, show a default based on if it's the current user
    return msg.userId === currentUserId ? 'You' : 'Unknown';
  };

  // Get player color
  const getPlayerColor = (userId: string) => {
    const player = players.find(p => p.userId === userId || p.id === userId);
    return player?.color;
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Chat"
      position={isMobile ? 'bottom' : 'right'}
      size="sm"
      className="flex flex-col h-[60vh] sm:h-full"
    >
      <div className="flex flex-col flex-1 h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isOwn = msg.userId === currentUserId;
                const userName = getUserName(msg);
                const playerColor = getPlayerColor(msg.userId);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[80%] px-3 py-2 rounded-2xl
                        ${isOwn 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}
                      `}
                    >
                      {!isOwn && (
                        <div className="flex items-center gap-1 mb-1">
                          {playerColor && (
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: playerColor }}
                            />
                          )}
                          <div className="text-xs opacity-75 font-medium">
                            {userName}
                          </div>
                        </div>
                      )}
                      <div className="text-sm break-words">{msg.text || msg.message}</div>
                      <div className={`text-xs mt-1 ${isOwn ? 'opacity-75' : 'opacity-50'}`}>
                        {formatTime(msg.createdAt || msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Chat disabled" : "Type a message..."}
              disabled={disabled || sending}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending || disabled}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {message.length > 150 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {200 - message.length} characters remaining
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  );
}
