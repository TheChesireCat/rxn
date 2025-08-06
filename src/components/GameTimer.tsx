'use client';

import React, { useState, useEffect } from 'react';

interface GameTimerProps {
  gameStartTime: number;
  gameTimeLimit?: number; // in minutes
  isGameActive: boolean;
  onTimeout?: () => void;
  className?: string;
}

export function GameTimer({ 
  gameStartTime, 
  gameTimeLimit, 
  isGameActive, 
  onTimeout,
  className = '' 
}: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!gameTimeLimit || !isGameActive) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - gameStartTime;
      const totalTime = gameTimeLimit * 60 * 1000; // Convert minutes to milliseconds
      const remaining = Math.max(0, totalTime - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onTimeout?.();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameStartTime, gameTimeLimit, isGameActive, onTimeout]);

  if (!gameTimeLimit || !isGameActive) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

  // Determine color based on time remaining
  const getTimerColor = () => {
    const totalTime = gameTimeLimit * 60 * 1000;
    const percentRemaining = timeRemaining / totalTime;
    
    if (percentRemaining > 0.5) return 'text-green-600 dark:text-green-400';
    if (percentRemaining > 0.25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = () => {
    const totalTime = gameTimeLimit * 60 * 1000;
    const percentRemaining = timeRemaining / totalTime;
    
    if (percentRemaining > 0.5) return 'bg-green-500';
    if (percentRemaining > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const progressPercentage = Math.max(0, (timeRemaining / (gameTimeLimit * 60 * 1000)) * 100);

  return (
    <div className={`${className}`}>
      <div className="text-center">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Game Time
        </div>
        <div className={`text-lg font-mono font-bold ${getTimerColor()}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {isExpired && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            Time&apos;s up!
          </div>
        )}
      </div>
    </div>
  );
}