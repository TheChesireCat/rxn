'use client';

import React from 'react';
import { MagicCodeLogin } from './MagicCodeLogin';
import { ModalBase } from '../ModalBase';
import { SessionManager } from '@/lib/sessionManager';
import type { User } from '@/types/game';

interface SessionRecoveryModalProps {
  isOpen: boolean;
  onClose?: () => void;
  username: string;
  email?: string;
  onRecovered: (user: User) => void;
}

export function SessionRecoveryModal({ 
  isOpen, 
  onClose,
  username, 
  email,
  onRecovered 
}: SessionRecoveryModalProps) {
  const handleAuthenticated = (user: User) => {
    // Update session with new authentication state
    SessionManager.updateAuthState(user.authUserId!, user.email!);
    onRecovered(user);
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      title="Session Expired"
      position="center"
      size="lg"
      showCloseButton={!!onClose}
    >
      <div className="p-6">
        {/* Warning Message */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start">
            <div className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">
                Your session has expired
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Please verify your identity to continue playing as <strong>"{username}"</strong>
                {email && (
                  <span className="block mt-1">
                    We'll send a verification code to <strong>{email}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Login Form - Pre-filled with username */}
        <MagicCodeLogin
          initialUsername={username}
          onAuthenticated={handleAuthenticated}
        />

        {/* Alternative Actions */}
        {onClose && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Don't want to recover your session right now?
            </p>
            <button
              onClick={() => {
                // Clear auth state and continue as unclaimed user
                SessionManager.handleInvalidAuth();
                onClose();
              }}
              className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Continue as guest (your stats won't be saved)
            </button>
          </div>
        )}
      </div>
    </ModalBase>
  );
}
