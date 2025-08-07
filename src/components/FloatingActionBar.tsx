'use client';

import React, { useState } from 'react';
import { Users, MessageCircle, Settings, BarChart3, HelpCircle, X } from 'lucide-react';

interface FloatingActionBarProps {
  onPlayersClick: () => void;
  onChatClick: () => void;
  onSettingsClick: () => void;
  onStatsClick: () => void;
  onHelpClick: () => void;
  playerCount?: number;
  unreadMessages?: number;
  isGameActive?: boolean;
  isMobile?: boolean;
}

export function FloatingActionBar({
  onPlayersClick,
  onChatClick,
  onSettingsClick,
  onStatsClick,
  onHelpClick,
  playerCount = 0,
  unreadMessages = 0,
  isGameActive = false,
  isMobile = false
}: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttons = [
    {
      icon: Users,
      label: 'Players',
      onClick: onPlayersClick,
      badge: playerCount > 0 ? playerCount : undefined,
      color: 'bg-blue-600 hover:bg-blue-700',
      show: true
    },
    {
      icon: MessageCircle,
      label: 'Chat',
      onClick: onChatClick,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
      color: 'bg-green-600 hover:bg-green-700',
      show: true
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: onSettingsClick,
      color: 'bg-gray-600 hover:bg-gray-700',
      show: !isGameActive
    },
    {
      icon: BarChart3,
      label: 'Stats',
      onClick: onStatsClick,
      color: 'bg-purple-600 hover:bg-purple-700',
      show: isGameActive
    },
    {
      icon: HelpCircle,
      label: 'Help',
      onClick: onHelpClick,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      show: true
    }
  ].filter(btn => btn.show);

  if (isMobile && !isExpanded) {
    // Mobile: Show single FAB that expands
    return (
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center"
          aria-label="Open menu"
        >
          <div className="relative">
            <Settings className="w-6 h-6" />
            {(unreadMessages > 0 || playerCount > 0) && (
              <span className="absolute -top-2 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </button>
      </div>
    );
  }

  const containerClass = isMobile
    ? "fixed bottom-6 right-6 z-20 flex flex-col-reverse gap-3"
    : "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2";

  return (
    <div className={containerClass}>
      {isMobile && isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className="w-14 h-14 rounded-full bg-gray-800 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      )}
      
      {buttons.map((button, index) => {
        const Icon = button.icon;
        const delay = isMobile ? index * 50 : 0;
        
        return (
          <button
            key={button.label}
            onClick={() => {
              button.onClick();
              if (isMobile) setIsExpanded(false);
            }}
            className={`
              ${isMobile ? 'w-14 h-14' : 'w-12 h-12 lg:w-14 lg:h-14'}
              rounded-full ${button.color} text-white shadow-lg hover:shadow-xl 
              transform hover:scale-110 transition-all duration-200 
              flex items-center justify-center relative group
              ${isMobile && isExpanded ? 'animate-float-in' : ''}
            `}
            style={{
              animationDelay: `${delay}ms`
            }}
            aria-label={button.label}
          >
            <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
            
            {button.badge && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {button.badge}
              </span>
            )}
            
            {!isMobile && (
              <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {button.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
