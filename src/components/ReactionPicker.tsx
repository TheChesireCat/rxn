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
          flex items-center justify-center w-8 h-8 rounded-full
          bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'bg-blue-100 dark:bg-blue-900' : ''}
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
          <div className="absolute bottom-full right-0 mb-2 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="grid grid-cols-5 gap-1 max-w-[200px]">
              {PREDEFINED_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="
                    w-8 h-8 flex items-center justify-center rounded
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    transition-colors duration-150
                    text-lg
                  "
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}