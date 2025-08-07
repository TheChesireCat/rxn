'use client';

import React, { useState } from 'react';
import { MagicCodeLogin } from './MagicCodeLogin';
import { AuthService } from '@/lib/authService';
import type { User } from '@/types/game';

interface EnhancedAuthFormProps {
  onAuthenticated: (user: User) => void;
  onGuestCreated: (username: string) => Promise<void>;
}

type AuthMode = 'login' | 'guest';

/**
 * Enhanced authentication form that supports both:
 * 1. Full magic code authentication (claimed users)
 * 2. Guest user creation (unclaimed users)
 */
export function EnhancedAuthForm({ onAuthenticated, onGuestCreated }: EnhancedAuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [guestUsername, setGuestUsername] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  // Handle authenticated users (claimed usernames)
  const handleUserAuthenticated = (user: User) => {
    onAuthenticated(user);
  };

  // Handle guest user creation (unclaimed usernames)
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestUsername.trim()) {
      setGuestError('Username is required');
      return;
    }

    setIsCreatingGuest(true);
    setGuestError(null);

    try {
      // Validate username format using AuthService
      const validation = AuthService.validateUsername(guestUsername.trim());
      if (!validation.valid) {
        setGuestError(validation.error || 'Invalid username format');
        return;
      }

      // Check if username is available for guest use
      const availability = await AuthService.checkUsernameAvailability(guestUsername.trim());
      
      if (!availability.available) {
        if (availability.isClaimed) {
          setGuestError('This username is registered. Please sign in to use it, or choose another name.');
        } else {
          setGuestError('This username is currently in use. Please choose another.');
        }
        return;
      }

      // Create guest user
      await onGuestCreated(guestUsername.trim());
    } catch (error) {
      console.error('Error creating guest user:', error);
      setGuestError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create user. Please try again.'
      );
    } finally {
      setIsCreatingGuest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => {
            setAuthMode('login');
            setGuestError(null);
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            authMode === 'login'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Sign In / Register
        </button>
        <button
          onClick={() => {
            setAuthMode('guest');
            setGuestError(null);
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            authMode === 'guest'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Play as Guest
        </button>
      </div>

      {/* Authentication Content */}
      {authMode === 'login' ? (
        <div>
          <MagicCodeLogin onAuthenticated={handleUserAuthenticated} />
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Play as Guest
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a username to start playing. You can register later to save your stats.
            </p>
          </div>

          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label htmlFor="guestUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="guestUsername"
                value={guestUsername}
                onChange={(e) => {
                  setGuestUsername(e.target.value);
                  setGuestError(null);
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your username..."
                disabled={isCreatingGuest}
                maxLength={20}
                autoFocus
              />
              {guestError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {guestError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreatingGuest || !guestUsername.trim()}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingGuest ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating User...
                </span>
              ) : (
                'Start Playing as Guest'
              )}
            </button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Playing as guest means:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Your stats won't be saved permanently</li>
                <li>• You can claim your username later if you win games</li>
                <li>• No email or registration required</li>
              </ul>
            </div>
          </form>
        </div>
      )}

      {/* Feature Comparison */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p className="mb-2">Why register your username?</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="font-medium text-green-600 dark:text-green-400">✓ Registered</p>
              <ul className="mt-1 space-y-1">
                <li>• Stats saved forever</li>
                <li>• Same name across devices</li>
                <li>• Passwordless sign-in</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">○ Guest</p>
              <ul className="mt-1 space-y-1">
                <li>• Play immediately</li>
                <li>• No email needed</li>
                <li>• Can register later</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
