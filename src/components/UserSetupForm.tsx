// Updated UserSetupForm with real-time username availability checking
'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/types/game';
import { useUsernameAvailability } from '@/lib/hooks/useUsernameAvailability';
import { UsernameAvailabilityIndicator } from '@/components/UsernameAvailabilityIndicator';

interface UserSetupFormProps {
  onUserCreated: (user: User) => void;
  onClaimRequired?: (username: string) => void;
}

export function UserSetupForm({ onUserCreated, onClaimRequired }: UserSetupFormProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the username availability hook
  const availabilityState = useUsernameAvailability();

  // Handle username input changes with real-time checking
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setError(null); // Clear any previous errors
    
    // Trigger debounced availability check
    availabilityState.checkUsername(newUsername);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    // Check if we have a valid availability result
    if (!availabilityState.result || availabilityState.isChecking) {
      setError('Please wait for username availability check to complete');
      return;
    }

    // Handle different availability states
    if (!availabilityState.result.available) {
      if (availabilityState.result.isClaimed) {
        // Username is claimed - trigger claim flow
        if (onClaimRequired) {
          onClaimRequired(username);
        }
        return;
      } else if (availabilityState.result.isActive) {
        // Username is currently in use
        setError('This username is currently in use. Please choose another.');
        return;
      }
    }

    // Validate format one more time
    const formatError = availabilityState.validateFormat(username);
    if (formatError) {
      setError(formatError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
        <div className="relative">
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors ${
              availabilityState.result?.available 
                ? 'border-green-300 dark:border-green-600' 
                : availabilityState.error || (availabilityState.result && !availabilityState.result.available)
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your username..."
            disabled={isLoading}
            maxLength={20}
            autoFocus
          />
          
          {/* Visual indicator in the input field */}
          {username.trim() && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {availabilityState.isChecking ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : availabilityState.result?.available ? (
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (availabilityState.error || (availabilityState.result && !availabilityState.result.available)) ? (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Username availability indicator */}
        <UsernameAvailabilityIndicator 
          state={availabilityState} 
          username={username} 
        />
        
        {/* Form submission error */}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isLoading || 
          !username.trim() || 
          availabilityState.isChecking || 
          !!availabilityState.error ||
          (availabilityState.result && !availabilityState.result.available && availabilityState.result.isClaimed)
        }
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating User...
          </span>
        ) : availabilityState.result?.isClaimed ? (
          'Sign In with This Username'
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
