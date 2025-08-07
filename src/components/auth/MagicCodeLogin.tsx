'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/instant';
import { AuthService } from '@/lib/authService';
import { ErrorDisplay, UsernameValidationError, MagicCodeRetryError, NetworkError } from './ErrorDisplay';
import { ProgressIndicator, AuthLoadingState } from './ProgressIndicator';
import type { User } from '@/types/game';

interface MagicCodeLoginProps {
  onAuthenticated: (user: User) => void;
  initialUsername?: string;
}

interface LoginState {
  step: 'username' | 'email' | 'code';
  username: string;
  email: string;
  isNewClaim: boolean;
  isLoading: boolean;
  loadingAction?: string;
  error: string | null;
  errorType?: 'validation' | 'auth' | 'network' | 'general';
  suggestions?: string[];
  canRetry?: boolean;
  retryAction?: 'resend' | 'back' | 'retry';
  retryAfter?: number;
  attemptCount: number;
}

export function MagicCodeLogin({ onAuthenticated, initialUsername = '' }: MagicCodeLoginProps) {
  const [state, setState] = useState<LoginState>({
    step: 'username',
    username: initialUsername,
    email: '',
    isNewClaim: false,
    isLoading: false,
    loadingAction: undefined,
    error: null,
    errorType: undefined,
    suggestions: [],
    canRetry: false,
    retryAction: undefined,
    retryAfter: undefined,
    attemptCount: 0,
  });

  const [code, setCode] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<{
    checking: boolean;
    available?: boolean;
    isClaimed?: boolean;
    reason?: string;
  }>({ checking: false });

  // Call useAuth hook at the top level
  const { user: instantUser } = db.useAuth();

  // Check if user is already authenticated with InstantDB
  useEffect(() => {
    const checkCurrentAuth = async () => {
      try {
        if (instantUser?.email) {
          console.log('User already authenticated with InstantDB:', instantUser.email);
          // Try to get their game profile
          const response = await fetch('/api/auth/get-user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: instantUser.email, 
              authUserId: instantUser.id 
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              onAuthenticated(data.user);
            }
          }
        }
      } catch (error) {
        console.error('Error checking current auth:', error);
      }
    };

    checkCurrentAuth();
  }, [instantUser, onAuthenticated]);

  // Reset state when initialUsername changes
  useEffect(() => {
    if (initialUsername && initialUsername !== state.username) {
      setState(prev => ({
        ...prev,
        username: initialUsername,
        step: 'username',
        error: null,
      }));
    }
  }, [initialUsername, state.username]);

  // Debounced username availability check
  useEffect(() => {
    if (!state.username.trim() || state.username.length < 3) {
      setUsernameAvailability({ checking: false });
      return;
    }

    // Clear previous state immediately to prevent duplication
    setUsernameAvailability({ checking: true });

    const timeoutId = setTimeout(async () => {
      
      try {
        const result = await AuthService.checkUsernameAvailability(state.username);
        setUsernameAvailability({
          checking: false,
          available: result.available,
          isClaimed: result.isClaimed,
          reason: result.reason,
        });
        
        if (!result.available && result.suggestions) {
          setState(prev => ({
            ...prev,
            suggestions: result.suggestions || [],
            errorType: result.errorType,
          }));
        } else {
          // Clear suggestions if username is available or claimed
          setState(prev => ({
            ...prev,
            suggestions: [],
            errorType: undefined,
          }));
        }
      } catch (error) {
        setUsernameAvailability({
          checking: false,
          reason: 'Error checking availability',
        });
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      // Clear checking state when component unmounts or username changes
      setUsernameAvailability(prev => ({ ...prev, checking: false }));
    };
  }, [state.username]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.username.trim()) {
      setState(prev => ({ 
        ...prev, 
        error: 'Username is required',
        errorType: 'validation' 
      }));
      return;
    }

    if (usernameAvailability.checking) {
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      loadingAction: 'processing',
      error: null,
      attemptCount: prev.attemptCount + 1
    }));

    try {
      // Check if username is claimed and get associated email
      const email = await AuthService.getEmailForUsername(state.username);
      
      if (email) {
        // Username is claimed - proceed to send magic code
        setState(prev => ({
          ...prev,
          email,
          isNewClaim: false,
          step: 'code',
          isLoading: false,
          loadingAction: undefined,
        }));
        
        // Send magic code to the associated email
        setState(prev => ({ 
          ...prev, 
          isLoading: true, 
          loadingAction: 'sending'
        }));
        
        const result = await AuthService.sendMagicCodeToEmail(email);
        if (!result.success) {
          setState(prev => ({ 
            ...prev, 
            error: result.error || 'Failed to send code', 
            errorType: result.errorType,
            canRetry: result.canRetry,
            retryAction: 'retry',
            step: 'username',
            isLoading: false,
            loadingAction: undefined
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            loadingAction: undefined
          }));
        }
      } else {
        // Username is not claimed - need email for new claim
        setState(prev => ({
          ...prev,
          isNewClaim: true,
          step: 'email',
          isLoading: false,
          loadingAction: undefined,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to process username. Please try again.',
        errorType: 'network',
        canRetry: true,
        retryAction: 'retry',
        isLoading: false,
        loadingAction: undefined,
      }));
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: 'Email is required' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await AuthService.sendMagicCodeToEmail(state.email);
      
      if (result.success) {
        setState(prev => ({ ...prev, step: 'code', isLoading: false }));
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to send code', isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to send verification code. Please try again.',
        isLoading: false,
      }));
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setState(prev => ({ 
        ...prev, 
        error: 'Please enter the complete 6-digit code',
        errorType: 'validation'
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      loadingAction: state.isNewClaim ? 'claiming' : 'authenticating',
      error: null,
      attemptCount: prev.attemptCount + 1
    }));

    try {
      // Sign in with magic code using InstantDB
      console.log('Attempting to sign in with magic code...');
      await db.auth.signInWithMagicCode({ 
        email: state.email, 
        code: code.trim() 
      });

      // Wait a moment for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the authenticated user from InstantDB
      const authUser = await db.getAuth();
      console.log('Authenticated with InstantDB:', authUser);

      if (!authUser || !authUser.email) {
        throw new Error('Authentication failed - no user returned');
      }

      // Now handle the game user creation/retrieval
      let gameUser: User;

      if (state.isNewClaim) {
        // Create a new game user with the claimed username
        console.log('Creating new game user with claimed username...');
        const response = await fetch('/api/user/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: state.username,
            authUserId: authUser.id,
            email: authUser.email
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create game user');
        }

        const result = await response.json();
        gameUser = result.data;
      } else {
        // Get existing game user profile
        console.log('Fetching existing game user profile...');
        const response = await fetch('/api/auth/get-user-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: authUser.email, 
            authUserId: authUser.id 
          })
        });

        if (!response.ok) {
          // User doesn't exist in game database, create them
          console.log('Game user not found, creating new user...');
          const createResponse = await fetch('/api/user/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: state.username,
              authUserId: authUser.id,
              email: authUser.email
            })
          });

          if (!createResponse.ok) {
            const error = await createResponse.json();
            throw new Error(error.error || 'Failed to create game user');
          }

          const createResult = await createResponse.json();
          gameUser = createResult.data;
        } else {
          const result = await response.json();
          gameUser = result.user;
        }
      }

      console.log('Successfully authenticated game user:', gameUser);
      onAuthenticated(gameUser);

    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Parse the error message
      let errorMessage = 'Authentication failed. Please try again.';
      let errorType: 'auth' | 'network' | 'general' = 'general';
      let canRetry = true;
      let retryAction: 'retry' | 'resend' | 'back' = 'retry';

      if (error.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('record not found') || msg.includes('expired')) {
          errorMessage = 'Verification code has expired or is invalid. Please request a new code.';
          errorType = 'auth';
          retryAction = 'back';
        } else if (msg.includes('invalid') || msg.includes('wrong')) {
          errorMessage = 'Invalid verification code. Please check and try again.';
          errorType = 'auth';
          retryAction = 'retry';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
          errorType = 'network';
        }
      }

      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        errorType,
        canRetry,
        retryAction,
        isLoading: false,
        loadingAction: undefined
      }));
      
      // Clear the code field
      setCode('');
    }
  };

  const handleBack = () => {
    if (state.step === 'email') {
      setState(prev => ({ 
        ...prev, 
        step: 'username', 
        error: null,
        errorType: undefined,
        suggestions: [],
        canRetry: false
      }));
    } else if (state.step === 'code') {
      setState(prev => ({ 
        ...prev, 
        step: state.isNewClaim ? 'email' : 'username', 
        error: null,
        errorType: undefined,
        suggestions: [],
        canRetry: false
      }));
      setCode('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setState(prev => ({
      ...prev,
      username: suggestion,
      error: null,
      errorType: undefined,
      suggestions: [],
    }));
  };

  const handleRetry = async () => {
    if (state.retryAction === 'resend' && state.email) {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        loadingAction: 'sending',
        error: null 
      }));
      
      try {
        const result = await AuthService.sendMagicCodeToEmail(state.email);
        setState(prev => ({
          ...prev,
          isLoading: false,
          loadingAction: undefined,
          error: result.success ? null : result.error,
          errorType: result.success ? undefined : result.errorType,
          canRetry: result.success ? false : result.canRetry,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          loadingAction: undefined,
          error: 'Failed to resend code. Please try again.',
          errorType: 'network',
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        error: null,
        errorType: undefined,
        canRetry: false,
        retryAction: undefined,
      }));
    }
  };

  const getUsernameValidationMessage = () => {
    if (!state.username.trim() || state.username.length < 3) return null;
    
    if (usernameAvailability.checking) {
      return (
        <span className="text-blue-400 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Checking availability...
        </span>
      );
    }
    
    if (usernameAvailability.isClaimed) {
      return <span className="text-green-400">✓ Username registered - ready to sign in</span>;
    }
    
    if (usernameAvailability.reason && !usernameAvailability.available) {
      return <span className="text-red-400">✗ {usernameAvailability.reason}</span>;
    }
    
    if (usernameAvailability.available) {
      return <span className="text-green-400">✓ Username available for claiming</span>;
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={state.step} isNewClaim={state.isNewClaim} />
      
      {/* Loading State */}
      {state.isLoading && (
        <AuthLoadingState
          currentStep={state.step}
          action={state.loadingAction || 'loading'}
          isNewClaim={state.isNewClaim}
        />
      )}
      
      {/* Header */}
      {!state.isLoading && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {state.step === 'username' && 'Welcome to Chain Reaction!'}
            {state.step === 'email' && 'Claim Your Username'}
            {state.step === 'code' && 'Enter Verification Code'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {state.step === 'username' && 'Enter your username to continue'}
            {state.step === 'email' && 'Enter your email to claim this username'}
            {state.step === 'code' && `Code sent to ${state.email}`}
          </p>
        </div>
      )}

      {/* Username Step */}
      {state.step === 'username' && !state.isLoading && (
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={state.username}
              onChange={(e) => setState(prev => ({ ...prev, username: e.target.value, error: null, errorType: undefined, suggestions: [] }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter your username..."
              disabled={state.isLoading}
              maxLength={20}
              autoFocus
            />
            <div className="mt-2 min-h-[20px]">
              {getUsernameValidationMessage()}
            </div>
          </div>

          {/* Error Display */}
          {state.error && state.errorType === 'validation' && (
            <UsernameValidationError
              error={state.error}
              suggestions={state.suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
          
          {state.error && state.errorType === 'network' && (
            <NetworkError
              error={state.error}
              onRetry={state.canRetry ? handleRetry : undefined}
            />
          )}
          
          {state.error && state.errorType === 'availability' && (
            <ErrorDisplay
              error={state.error}
              type="general"
              suggestions={state.suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          )}

          <button
            type="submit"
            disabled={state.isLoading || !state.username.trim() || usernameAvailability.checking}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
      )}

      {/* Email Step */}
      {state.step === 'email' && !state.isLoading && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Username: {state.username}
            </p>
            <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
              This username is available! Enter your email to claim it.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={state.email}
              onChange={(e) => setState(prev => ({ ...prev, email: e.target.value, error: null, errorType: undefined }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="your@email.com"
              disabled={state.isLoading}
              autoFocus
            />
          </div>

          {state.error && (
            <ErrorDisplay
              error={state.error}
              type={state.errorType || 'general'}
              onRetry={state.canRetry && state.retryAction ? handleRetry : undefined}
              onBack={handleBack}
            />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={state.isLoading}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={state.isLoading || !state.email.trim()}
              className="flex-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Code
            </button>
          </div>
        </form>
      )}

      {/* Code Step */}
      {state.step === 'code' && !state.isLoading && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              {state.isNewClaim ? 'Claiming' : 'Signing in as'}: {state.username}
            </p>
            <p className="text-green-600 dark:text-green-300 text-sm mt-1">
              Check your email for the verification code
            </p>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setState(prev => ({ ...prev, error: null, errorType: undefined }));
              }}
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white tracking-widest"
              placeholder="000000"
              maxLength={6}
              disabled={state.isLoading}
              autoFocus
            />
          </div>

          {state.error && (
            <MagicCodeRetryError
              error={state.error}
              onRetry={state.canRetry && state.retryAction === 'retry' ? () => {
                setState(prev => ({ ...prev, error: null, errorType: undefined }));
              } : undefined}
              onBack={state.canRetry && state.retryAction === 'resend' ? handleRetry : handleBack}
            />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={state.isLoading}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={state.isLoading || code.length !== 6}
              className="flex-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isNewClaim ? 'Claim Username' : 'Sign In'}
            </button>
          </div>
        </form>
      )}

      {/* Help Text */}
      {!state.isLoading && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {state.step === 'username' && (
            <>
              <p>Enter your username to sign in or claim a new one</p>
              <p className="mt-1">No password needed - we'll send you a verification code</p>
            </>
          )}
          {state.step === 'email' && (
            <p>We'll send you a verification code to complete the username claim</p>
          )}
          {state.step === 'code' && (
            <div className="space-y-1">
              <p>Didn't receive the code? Check your spam folder</p>
              {state.retryAction === 'resend' && (
                <button
                  onClick={handleRetry}
                  disabled={state.isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                >
                  Resend verification code
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
