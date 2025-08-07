'use client';

import React from 'react';
import type { UsernameValidationState } from '@/lib/hooks/useUsernameAvailability';

interface UsernameAvailabilityIndicatorProps {
  state: UsernameValidationState;
  username: string;
}

export function UsernameAvailabilityIndicator({ 
  state, 
  username 
}: UsernameAvailabilityIndicatorProps) {
  // Don't show anything if username is empty
  if (!username.trim()) {
    return null;
  }

  // Show loading spinner while checking
  if (state.isChecking) {
    return (
      <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Checking availability...
      </div>
    );
  }

  // Show format validation error
  if (state.error) {
    return (
      <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        {state.error}
      </div>
    );
  }

  // Show availability result
  if (state.result) {
    if (state.result.available) {
      return (
        <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
          Available! This username is ready to use.
        </div>
      );
    } else {
      // Username is not available
      const { isClaimed, isActive, lastActive } = state.result;
      
      if (isClaimed) {
        return (
          <div className="flex items-center mt-2 text-sm text-orange-600 dark:text-orange-400">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
                clipRule="evenodd" 
              />
            </svg>
            This username is registered. Sign in to use it.
          </div>
        );
      } else if (isActive && lastActive) {
        const minutesAgo = Math.floor((Date.now() - lastActive) / 60000);
        return (
          <div className="flex items-center mt-2 text-sm text-yellow-600 dark:text-yellow-400">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                clipRule="evenodd" 
              />
            </svg>
            Currently in use (active {minutesAgo}m ago). Try another.
          </div>
        );
      } else {
        return (
          <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            {state.result.message || 'This username is not available.'}
          </div>
        );
      }
    }
  }

  return null;
}