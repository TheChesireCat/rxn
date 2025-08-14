'use client';

import React, { useState, useEffect } from 'react';

interface MoveTimerProps {
  turnStartedAt: number;
  moveTimeLimit?: number; // in seconds
  isCurrentPlayerTurn: boolean;
  isGameActive: boolean;
  onTimeout?: () => void;
  className?: string;
}

export function MoveTimer({ 
  turnStartedAt, 
  moveTimeLimit, 
  isCurrentPlayerTurn, 
  isGameActive, 
  onTimeout,
  className = '' 
}: MoveTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!moveTimeLimit || !isGameActive) {
      return;
    }

    // Reset expired state when turn changes
    setIsExpired(false);

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - turnStartedAt;
      const totalTime = moveTimeLimit * 1000; // Convert seconds to milliseconds
      const remaining = Math.max(0, totalTime - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
        onTimeout?.();
      }
    };

    // Update immediately
    updateTimer();

    // Update every 100ms for smoother countdown
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [turnStartedAt, moveTimeLimit, isGameActive, onTimeout]);



  const seconds = Math.ceil(timeRemaining / 1000);

  // Determine color and urgency based on time remaining
  const getTimerColor = () => {
    const totalTime = moveTimeLimit;
    const percentRemaining = seconds / totalTime;
    
    if (percentRemaining > 0.5) return 'text-blue-600 dark:text-blue-400';
    if (percentRemaining > 0.25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = () => {
    const totalTime = moveTimeLimit;
    const percentRemaining = seconds / totalTime;
    
    if (percentRemaining > 0.5) return 'bg-blue-500';
    if (percentRemaining > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBorderColor = () => {
    if (!isCurrentPlayerTurn) return 'border-gray-300 dark:border-gray-600';
    
    const totalTime = moveTimeLimit;
    const percentRemaining = seconds / totalTime;
    
    if (percentRemaining > 0.5) return 'border-blue-300 dark:border-blue-600';
    if (percentRemaining > 0.25) return 'border-yellow-300 dark:border-yellow-600';
    return 'border-red-300 dark:border-red-600';
  };

  const progressPercentage = Math.max(0, (timeRemaining / (moveTimeLimit * 1000)) * 100);

  // Add pulsing animation when time is running low
  const shouldPulse = seconds <= 5 && isCurrentPlayerTurn && !isExpired;

  return (
    // This outer div is now always present and holds the space
    <div className={`${className}`}>
      {/* This inner div contains all content and is what becomes invisible */}
      <div className={`
        p-3 rounded-lg border-2 transition-all duration-300
        ${getBorderColor()}
        ${shouldPulse ? 'animate-pulse' : ''}
        ${isCurrentPlayerTurn ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
        ${(!moveTimeLimit || !isGameActive) ? 'invisible' : ''}
      `}>
        <div className="text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {isCurrentPlayerTurn ? 'Your Turn' : 'Move Time'}
          </div>
          <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
            {seconds}s
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-100 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Always reserve space for status text to prevent layout shifts */}
          <div className="mt-1 h-4 flex items-center justify-center">
            {isExpired ? (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                Time&apos;s up!
              </span>
            ) : !isCurrentPlayerTurn ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Waiting for player
              </span>
            ) : (
              <span className="text-xs text-transparent">
                &nbsp;
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}