// Simple claim username button that appears after wins
'use client';

import React, { useState } from 'react';
import { ClaimUsernameModal } from './auth/ClaimUsernameModal';
import type { User } from '@/types/game';

interface ClaimUsernameButtonProps {
  user: User;
  onClaimed?: () => void;
}

export function ClaimUsernameButton({ user, onClaimed }: ClaimUsernameButtonProps) {
  const [showModal, setShowModal] = useState(false);

  // Only show for unclaimed users with wins
  if (!user || user.wins === 0) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-yellow-50/90 to-orange-50/90 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
              🎉 You've won {user.wins} game{user.wins > 1 ? 's' : ''}!
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              Claim your username to save your stats permanently
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            Claim Name
          </button>
        </div>
      </div>

      {showModal && (
        <ClaimUsernameModal
          username={user.name}
          stats={{ wins: user.wins, gamesPlayed: user.gamesPlayed }}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onClaimed?.();
          }}
        />
      )}
    </>
  );
}
