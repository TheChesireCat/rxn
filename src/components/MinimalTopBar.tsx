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
  const [copiedId, setCopiedId] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const router = useRouter();

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
    }
  };

  const handleCopyRoomName = async () => {
    if (!room?.name) return;
    try {
      await navigator.clipboard.writeText(room.name);
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    } catch (error) {
      console.error('Failed to copy room name:', error);
    }
  };

  const handleCopyRoomUrl = async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy room URL:', error);
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

        {/* Right: Room Info */}
        <div className="flex items-center gap-1">
          {/* Room Name */}
          {room?.name && (
            <button
              onClick={handleCopyRoomName}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 group"
              aria-label="Copy room name"
              title={`Copy room name: ${room.name}`}
            >
              <span className="text-xs font-medium text-green-700 dark:text-green-300 max-w-20 truncate hidden sm:inline">
                {room.name}
              </span>
              <span className="text-xs font-medium text-green-700 dark:text-green-300 sm:hidden">
                Name
              </span>
              {copiedName ? (
                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-green-500 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300" />
              )}
            </button>
          )}
          
          {/* Room URL */}
          <button
            onClick={handleCopyRoomUrl}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200 group"
            aria-label="Copy room URL"
            title={`Copy room URL`}
          >
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              URL
            </span>
            {copiedUrl ? (
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-purple-500 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
            )}
          </button>
          
          {/* Room ID */}
          <button
            onClick={handleCopyRoomId}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 group"
            aria-label="Copy room ID"
            title={`Copy room ID: ${roomId}`}
          >
            <span className="text-xs font-mono text-blue-700 dark:text-blue-300 hidden sm:inline">
              ID: {roomId.slice(0, 6)}
            </span>
            <span className="text-xs font-mono text-blue-700 dark:text-blue-300 sm:hidden">
              ID
            </span>
            {copiedId ? (
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-blue-500 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
