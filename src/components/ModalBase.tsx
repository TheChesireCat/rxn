'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'center' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

export function ModalBase({
  isOpen,
  onClose,
  title,
  children,
  position = 'center',
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  className = ''
}: ModalBaseProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full'
  };

  const positionClasses = {
    center: 'items-center justify-center',
    right: 'items-center justify-end',
    bottom: 'items-end justify-center',
    left: 'items-center justify-start'
  };

  const slideClasses = {
    center: 'scale-95 opacity-0',
    right: 'translate-x-full',
    bottom: 'translate-y-full',
    left: '-translate-x-full'
  };

  const modalPositionClasses = {
    center: 'rounded-xl',
    right: 'h-full rounded-l-xl',
    bottom: 'w-full rounded-t-xl',
    left: 'h-full rounded-r-xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className={`absolute inset-0 flex ${positionClasses[position]} p-4`}>
        <div
          ref={modalRef}
          className={`
            relative bg-white dark:bg-gray-900 shadow-2xl
            ${modalPositionClasses[position]}
            ${sizeClasses[size]}
            ${position === 'bottom' ? 'max-h-[80vh]' : ''}
            ${position === 'right' || position === 'left' ? 'max-w-sm w-full' : ''}
            transform transition-all duration-300 ease-out
            ${isOpen ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : slideClasses[position]}
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
