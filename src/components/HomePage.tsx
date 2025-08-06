'use client';

import React, { useState, useEffect } from 'react';
import { SessionManager } from '@/lib/sessionManager';
import { CreateGameForm } from './CreateGameForm';
import { JoinGameForm } from './JoinGameForm';
import { UserSetupForm } from './UserSetupForm';
import { RejoinGamePrompt } from './RejoinGamePrompt';
import type { User } from '@/types/game';

type ViewMode = 'main' | 'create' | 'join' | 'userSetup';

export function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleUserCreated = (user: User) => {
    setCurrentUser(user);
    SessionManager.storeSession(user);
    setViewMode('main');
  };

  const handleBackToMain = () => {
    setViewMode('main');
  };

  const handleLogout = () => {
    SessionManager.clearSession();
    setCurrentUser(null);
    setHasActiveGame(false);
    setViewMode('main');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 dark:bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-300 dark:bg-purple-600 rounded-full opacity-20 animate-pulse" style={{animationDelay: '0.7s'}}></div>
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
      
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 dark:bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-300 dark:bg-purple-600 rounded-full opacity-20 animate-pulse" style={{animationDelay: '0.7s'}}></div>
        <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-pink-300 dark:bg-pink-600 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 sm:py-16 relative z-10">
        
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-6">
            <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Live Chain Reaction
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Real-time multiplayer strategy game where players place orbs to trigger explosive chain reactions
          </p>
          
          {/* Enhanced user info and logout */}
          {currentUser && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="glass backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-700 dark:text-gray-300">
                  Welcome back, <strong className="text-blue-600 dark:text-blue-400">{currentUser.name}</strong>
                </span>
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
              <UserSetupForm onUserCreated={handleUserCreated} />
            </div>
          ) : (
            <>
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
    </div>
  );
}