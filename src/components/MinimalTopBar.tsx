'use client';

import React, { useState } from 'react';
import { Menu, Copy, Check, Home, Users } from 'lucide-react';
import { Room, Player } from '@/types/game';
import { useRouter } from 'next/navigation';

interface MinimalTopBarProps {
  room?: Room;
  currentPlayer?: Player;
  roomId: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function MinimalTopBar({
  room,
  currentPlayer,
  roomId,
  onMenuClick,
  showMenu = true
}: MinimalTopBarProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  // Determine what to show in the center
  const getCenterContent = () => {
    if (room?.status === 'playing' && currentPlayer) {
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: currentPlayer.color }}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentPlayer.name}'s Turn
          </span>
        </div>
      );
    }

    if (room?.status === 'waiting') {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>Waiting for players...</span>
        </div>
      );
    }

    if (room?.status === 'finished') {
      return (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Game Over
        </span>
      );
    }

    return (
      <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Chain Reaction
      </span>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-30">
      <div className="h-full px-4 flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left: Menu/Home */}
        <div className="flex items-center gap-2">
          {showMenu ? (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          ) : (
            <button
              onClick={handleHomeClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Home"
            >
              <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>

        {/* Center: Dynamic Content */}
        <div className="flex-1 flex items-center justify-center">
          {getCenterContent()}
        </div>

        {/* Right: Room ID */}
        <div className="flex items-center">
          <button
            onClick={handleCopyRoomId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
            aria-label="Copy room ID"
          >
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 hidden sm:inline">
              Room:
            </span>
            <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
              {roomId.slice(0, 8)}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
