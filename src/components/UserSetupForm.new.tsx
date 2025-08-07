// Updated UserSetupForm with name availability checking
'use client';

import React, { useState } from 'react';
import type { User } from '@/types/game';

interface UserSetupFormProps {
  onUserCreated: (user: User) => void;
  onClaimRequired?: (username: string) => void;
}

export function UserSetupForm({ onUserCreated, onClaimRequired }: UserSetupFormProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers, _, -)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if username is available or needs to be claimed
      const checkResponse = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResult.available) {
        if (checkResult.isClaimed) {
          // Username is claimed - need to sign in with email
          setError('This username is registered. Sign in with email to use it.');
          if (onClaimRequired) {
            onClaimRequired(username);
          }
          setIsLoading(false);
          return;
        } else if (checkResult.isActive) {
          // Username is currently in use (active session)
          const lastActive = new Date(checkResult.lastActive);
          const minutesAgo = Math.floor((Date.now() - lastActive.getTime()) / 60000);
          
          if (minutesAgo < 30) {
            setError(`This username is currently in use (active ${minutesAgo}m ago). Try another.`);
            setIsLoading(false);
            return;
          }
          // If inactive for 30+ minutes, allow takeover
        }
      }

      // Create user session (unclaimed for now)
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create user');
      }

      const result = await response.json();
      onUserCreated(result.data);

    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Chain Reaction!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a username to start playing
        </p>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Enter your username..."
          disabled={isLoading}
          maxLength={20}
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !username.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking...
          </span>
        ) : (
          'Start Playing'
        )}
      </button>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>No registration required!</p>
        <p className="mt-1">You can claim your username later to save stats.</p>
      </div>
    </form>
  );
}
