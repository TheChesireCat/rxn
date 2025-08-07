'use client';

import React, { useState } from 'react';
import { AuthService } from '@/lib/authService';
import { ModalBase } from '../ModalBase';

interface ClaimUsernameModalProps {
  username: string;
  stats: { wins: number; gamesPlayed: number };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClaimUsernameModal({ 
  username,
  stats,
  isOpen, 
  onClose,
  onSuccess 
}: ClaimUsernameModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const sendMagicCode = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use AuthService to send magic code
      const result = await AuthService.sendMagicCodeToEmail(email);
      
      if (result.success) {
        setCodeSent(true);
      } else {
        setError(result.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      console.error('Error sending magic code:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndClaim = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setClaiming(true);
    setError(null);

    try {
      // First verify the magic code and authenticate
      const authResult = await AuthService.verifyMagicCode(email, code);
      
      if (!authResult.success) {
        setError(authResult.error || 'Failed to verify code. Please try again.');
        return;
      }

      // Get the InstantDB auth user ID (this is different from our user profile ID)
      // We need to get this from the InstantDB auth system after successful verification
      // The AuthService.verifyMagicCode should have authenticated us, so we can get the auth user
      const { db } = await import('@/lib/instant');
      const instantAuthUser = db.auth.user();
      
      if (!instantAuthUser?.id) {
        setError('Authentication failed. Please try again.');
        return;
      }

      // Now claim the username using the InstantDB auth user ID
      const claimResult = await AuthService.claimUsername(username, instantAuthUser.id, email);
      
      if (!claimResult.success) {
        setError(claimResult.error || 'Failed to claim username. Please try again.');
        return;
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error claiming username:', err);
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
      setClaiming(false);
    }
  };

  const resetFlow = () => {
    setCodeSent(false);
    setCode('');
    setError(null);
    setClaiming(false);
  };

  const resetAll = () => {
    setEmail('');
    setCode('');
    setCodeSent(false);
    setLoading(false);
    setError(null);
    setClaiming(false);
  };

  // Reset state when modal closes
  const handleClose = () => {
    resetAll();
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Claim Your Username">
      <div className="space-y-4">
        {/* Username and stats display */}
        <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-lg">
          <h3 className="font-bold text-blue-200 text-lg mb-2">🎮 {username}</h3>
          <div className="flex gap-4 text-sm text-blue-100">
            <span>🏆 {stats.wins} win{stats.wins !== 1 ? 's' : ''}</span>
            <span>🎯 {stats.gamesPlayed} game{stats.gamesPlayed !== 1 ? 's' : ''}</span>
            {stats.gamesPlayed > 0 && (
              <span>📊 {Math.round((stats.wins / stats.gamesPlayed) * 100)}% win rate</span>
            )}
          </div>
        </div>

        {!codeSent ? (
          <>
            <div>
              <p className="text-gray-300 mb-3">
                Register your email to save your stats permanently and appear on the leaderboard!
              </p>
              <p className="text-sm text-gray-400 mb-2">
                We'll send you a verification code - no password needed.
              </p>
              <div className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                💡 <strong>Tip:</strong> After claiming, you can login with just your username in future sessions!
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMagicCode()}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            
            <button
              onClick={sendMagicCode}
              disabled={loading || !email}
              className="w-full py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="text-gray-300 mb-2">
                Enter the 6-digit code sent to:
              </p>
              <p className="font-semibold text-white mb-2">{email}</p>
              <p className="text-xs text-gray-400">
                Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>
            
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verifyAndClaim()}
                className="w-full px-4 py-3 text-center text-2xl font-mono bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-widest"
                maxLength={6}
                disabled={loading}
                autoFocus
              />
            </div>
            
            <button
              onClick={verifyAndClaim}
              disabled={loading || code.length !== 6}
              className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {claiming ? 'Claiming Username...' : 'Verifying...'}
                </span>
              ) : (
                'Claim Username'
              )}
            </button>
            
            <button
              onClick={resetFlow}
              disabled={loading}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors"
            >
              Use different email
            </button>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-red-400 mt-0.5">⚠️</span>
              <div className="text-red-200">
                {error}
                {error.includes('expired') && (
                  <div className="mt-2">
                    <button
                      onClick={resetFlow}
                      className="text-sm text-red-300 hover:text-red-100 underline"
                    >
                      Request a new code
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!codeSent && (
          <p className="text-xs text-gray-500 text-center">
            By claiming your username, you agree to receive game-related emails.
            Your stats will be visible on the public leaderboard.
          </p>
        )}
      </div>
    </ModalBase>
  );
}
