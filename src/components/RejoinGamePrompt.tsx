'use client';

import React from 'react';
import { SessionManager } from '@/lib/sessionManager';
import { useRouter } from 'next/navigation';

interface RejoinGamePromptProps {
  onDismiss: () => void;
}

export function RejoinGamePrompt({ onDismiss }: RejoinGamePromptProps) {
  const router = useRouter();
  const activeRoom = SessionManager.getActiveRoom();

  if (!activeRoom) {
    onDismiss();
    return null;
  }

  const handleRejoin = () => {
    router.push(`/room/${activeRoom.roomId}`);
  };

  const handleDismiss = () => {
    SessionManager.clearActiveRoom();
    onDismiss();
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Active Game Found
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>You have an active game in room &quot;{activeRoom.roomName}&quot;. Would you like to rejoin?</p>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleRejoin}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Rejoin Game
            </button>
            <button
              onClick={handleDismiss}
              className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-yellow-800 dark:text-yellow-200 text-sm font-medium py-2 px-4 rounded-md border border-yellow-300 dark:border-yellow-600 transition-colors duration-200"
            >
              Start New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}