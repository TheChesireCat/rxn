'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionNotificationProps {
  playerName: string;
  isOnline: boolean;
  onDismiss: () => void;
}

export function ConnectionNotification({ 
  playerName, 
  isOnline, 
  onDismiss 
}: ConnectionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div 
        className={`
          flex items-center gap-3 p-4 rounded-lg shadow-lg border
          ${isOnline 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }
          backdrop-blur-sm
        `}
      >
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isOnline 
            ? 'bg-green-100 dark:bg-green-800/50' 
            : 'bg-orange-100 dark:bg-orange-800/50'
          }
        `}>
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`
            text-sm font-medium
            ${isOnline 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-orange-800 dark:text-orange-200'
            }
          `}>
            {playerName}
          </p>
          <p className={`
            text-xs
            ${isOnline 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-orange-600 dark:text-orange-400'
            }
          `}>
            {isOnline ? 'is back online' : 'went offline'}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
            hover:bg-black/10 dark:hover:bg-white/10 transition-colors
            ${isOnline 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-orange-600 dark:text-orange-400'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}