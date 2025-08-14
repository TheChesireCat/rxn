'use client';

import React, { useState, useEffect } from 'react';
import { SessionManager } from '@/lib/sessionManager';
import { CreateGameForm } from './CreateGameForm';
import { JoinGameForm } from './JoinGameForm';
import { EnhancedAuthForm } from './auth/EnhancedAuthForm';
import { RejoinGamePrompt } from './RejoinGamePrompt';
import { ClaimUsernameButton } from './ClaimUsernameButton';
import { TutorialModal } from './TutorialModal';
import type { User } from '@/types/game';

type ViewMode = 'main' | 'create' | 'join' | 'userSetup';

export function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check for existing session
    const session = SessionManager.getSession();
    if (session) {
      setCurrentUser(session.user);

      // Check if there's an active game and validate it exists
      const checkActiveGame = async () => {
        const activeRoom = SessionManager.getActiveRoom();
        if (activeRoom) {
          try {
            // Validate the room still exists
            const response = await fetch(`/api/room/${activeRoom.roomId}`);
            const result = await response.json();

            if (result.success && result.data) {
              setHasActiveGame(true);
            } else {
              // Room doesn't exist anymore, clear it from session
              SessionManager.clearActiveRoom();
              setHasActiveGame(false);
            }
          } catch (error) {
            // If we can't validate, clear the room
            SessionManager.clearActiveRoom();
            setHasActiveGame(false);
          }
        }
        setIsLoading(false);
      };

      checkActiveGame();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleUserAuthenticated = async (user: User) => {
    // Store the authenticated user (either claimed or unclaimed)
    setCurrentUser(user);
    SessionManager.storeSession(user);
    setViewMode('main');
  };

  const handleGuestUserCreated = async (username: string) => {
    try {
      // Create an unclaimed user for guest play
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
      handleUserAuthenticated(result.data);
    } catch (error) {
      console.error('Error creating guest user:', error);
      // The MagicCodeLogin component should handle this error
      throw error;
    }
  };

  const handleBackToMain = () => {
    setViewMode('main');
  };

  const handleLogout = async () => {
    // Sign out from InstantDB if user is claimed
    if (currentUser?.isClaimed) {
      try {
        const { AuthService } = await import('@/lib/authService');
        await AuthService.signOut();
      } catch (error) {
        console.error('Error signing out from InstantDB:', error);
        // Continue with logout even if InstantDB sign out fails
      }
    }

    // Clear local session
    SessionManager.clearSession();
    setCurrentUser(null);
    setHasActiveGame(false);
    setViewMode('main');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background orbs - smaller and further from edges */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[35%] left-[15%] w-32 h-32 sm:w-48 sm:h-48 bg-blue-300 dark:bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-[30%] right-[20%] w-24 h-24 sm:w-36 sm:h-36 bg-purple-300 dark:bg-purple-600 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse text-lg font-medium">Initializing game...</p>
          <div className="loading-dots mt-4 justify-center text-blue-600 dark:text-blue-400">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden relative">

      {/* Animated background orbs - smaller and further from edges */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[35%] left-[15%] w-32 h-32 sm:w-48 sm:h-48 bg-blue-300 dark:bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[30%] right-[20%] w-24 h-24 sm:w-36 sm:h-36 bg-purple-300 dark:bg-purple-600 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute top-[60%] left-[70%] w-20 h-20 sm:w-28 sm:h-28 bg-pink-300 dark:bg-pink-600 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[20%] right-[35%] w-16 h-16 sm:w-24 sm:h-24 bg-green-300 dark:bg-green-600 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '1.3s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-16 relative z-10">

        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-6">
            <h1 className="text-7xl sm:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              ChainReaction++
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto">
            A clone of the classic{' '}
            <a
              href="https://brilliant.org/wiki/chain-reaction-game/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
            >
              Chain Reaction game
            </a>
          </p>

          {/* Tutorial prompt */}
          <div className="mb-6 sm:mb-8">
            <div className="glass backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 max-w-md mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <strong className="text-gray-800 dark:text-gray-200">PSSST:</strong> if this is your first time playing{' '}
                <button
                  onClick={() => setShowTutorial(true)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"
                >
                  click here
                </button>
              </p>
            </div>
          </div>

          {/* Enhanced user info and logout */}
          {currentUser && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="glass backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome back, <strong className="text-blue-600 dark:text-blue-400">{currentUser.name}</strong>
                  </span>
                  {/* User status indicator */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentUser.isClaimed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                    {currentUser.isClaimed ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Registered</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Guest</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
              >
                Switch User
              </button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="max-w-md mx-auto">
          {!currentUser ? (
            <div className="glass backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
              <EnhancedAuthForm onAuthenticated={handleUserAuthenticated} onGuestCreated={handleGuestUserCreated} />
            </div>
          ) : (
            <>
              {/* Claim username prompt for successful guest users */}
              {!currentUser.isClaimed && currentUser.wins > 0 && (
                <div className="mb-6">
                  <ClaimUsernameButton
                    user={currentUser}
                    onClaimed={() => {
                      // Refresh user data after claiming
                      const updatedUser = { ...currentUser, isClaimed: true };
                      handleUserAuthenticated(updatedUser);
                    }}
                  />
                </div>
              )}

              {/* Rejoin active game prompt */}
              {hasActiveGame && viewMode === 'main' && (
                <div className="mb-6">
                  <RejoinGamePrompt onDismiss={() => setHasActiveGame(false)} />
                </div>
              )}

              {/* Main menu */}
              {viewMode === 'main' && (
                <div className="glass backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                    Choose Your Action
                  </h2>

                  <div className="space-y-4">
                    {/* Enhanced Create Game Button */}
                    <button
                      onClick={() => setViewMode('create')}
                      className="group w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-bold py-4 px-8 rounded-xl btn-enhanced hover:shadow-2xl shadow-glow"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-lg">Create New Game</span>
                      </div>
                    </button>

                    {/* Enhanced Join Game Button */}
                    <button
                      onClick={() => setViewMode('join')}
                      className="group w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white font-bold py-4 px-8 rounded-xl btn-enhanced hover:shadow-2xl shadow-glow"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-lg">Join Existing Game</span>
                      </div>
                    </button>
                  </div>

                  {/* Quick stats */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      <p>Games Played: {currentUser.gamesPlayed}</p>
                      <p>Wins: {currentUser.wins}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Create game form */}
              {viewMode === 'create' && (
                <div className="glass backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                  <CreateGameForm
                    currentUser={currentUser}
                    onBack={handleBackToMain}
                  />
                </div>
              )}

              {/* Join game form */}
              {viewMode === 'join' && (
                <div className="glass backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                  <JoinGameForm
                    currentUser={currentUser}
                    onBack={handleBackToMain}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}