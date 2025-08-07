'use client';

import React, { useState } from 'react';

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

const PREDEFINED_EMOJIS = [
  '😀', '😂', '😍', '🤔', '😮', '😢', '😡', '👍', '👎', '❤️',
  '🔥', '💯', '🎉', '😎', '🤯', '😱', '🙄', '😴', '🤝', '👏'
];

export function ReactionPicker({ onReactionSelect, disabled = false, className = '' }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onReactionSelect(emoji);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Reaction button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-center w-9 h-9 rounded-full
          bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700
          border border-gray-200 dark:border-gray-600
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          ${isOpen ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600' : ''}
        `}
        title="Add reaction"
      >
        <span className="text-lg">😊</span>
      </button>

      {/* Emoji picker dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Picker panel */}
          <div className="absolute bottom-full right-0 mb-3 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                Add Reaction
              </h3>
            </div>
            
            {/* Emoji grid */}
            <div className="p-3">
              <div className="grid grid-cols-5 gap-2 w-[220px]">
                {PREDEFINED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="
                      w-9 h-9 flex items-center justify-center rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-all duration-150
                      text-lg hover:scale-110 active:scale-95
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    "
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Footer tip */}
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Click to send reaction
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
