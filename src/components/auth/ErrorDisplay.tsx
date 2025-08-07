'use client';

import React from 'react';

interface ErrorDisplayProps {
  error: string;
  type?: 'validation' | 'auth' | 'network' | 'general';
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

/**
 * Enhanced error display component with specific messaging and recovery actions
 * Implements requirements 1.5, 2.4, 4.4 for comprehensive error handling
 */
export function ErrorDisplay({ 
  error, 
  type = 'general',
  suggestions = [],
  onSuggestionClick,
  onRetry,
  onBack,
  className = ''
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (type) {
      case 'validation':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'auth':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        );
      case 'network':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getErrorStyles = () => {
    switch (type) {
      case 'validation':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          title: 'text-yellow-800 dark:text-yellow-200',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          subtitle: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'auth':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          title: 'text-red-800 dark:text-red-200',
          text: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700',
          subtitle: 'text-red-600 dark:text-red-400'
        };
      case 'network':
        return {
          container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
          title: 'text-orange-800 dark:text-orange-200',
          text: 'text-orange-700 dark:text-orange-300',
          icon: 'text-orange-600 dark:text-orange-400',
          button: 'bg-orange-600 hover:bg-orange-700',
          subtitle: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          title: 'text-red-800 dark:text-red-200',
          text: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700',
          subtitle: 'text-red-600 dark:text-red-400'
        };
    }
  };

  const styles = getErrorStyles();

  return (
    <div className={`p-4 ${styles.container} border rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className={`${styles.icon} mr-3 mt-0.5`}>
          {getErrorIcon()}
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${styles.title} mb-1`}>
            {type === 'validation' && 'Invalid Username'}
            {type === 'auth' && 'Authentication Failed'}
            {type === 'network' && 'Connection Error'}
            {type === 'general' && 'Error'}
          </h3>
          <p className={`text-sm ${styles.text}`}>
            {error}
          </p>
          
          {/* Username Suggestions - Requirement 1.5 */}
          {suggestions.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs ${styles.subtitle} mb-2`}>
                Try these alternatives:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className={`px-2 py-1 text-xs ${styles.button} text-white rounded hover:opacity-90 transition-opacity`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recovery Actions */}
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`px-3 py-1 text-xs ${styles.button} text-white rounded font-medium hover:opacity-90 transition-opacity`}
              >
                {type === 'auth' ? 'Try Again' : 'Retry'}
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Specific error components for common scenarios
 */

export function UsernameValidationError({ 
  error, 
  suggestions = [], 
  onSuggestionClick, 
  className 
}: Pick<ErrorDisplayProps, 'error' | 'suggestions' | 'onSuggestionClick' | 'className'>) {
  return (
    <ErrorDisplay
      error={error}
      type="validation"
      suggestions={suggestions}
      onSuggestionClick={onSuggestionClick}
      className={className}
    />
  );
}

export function MagicCodeRetryError({ 
  error, 
  onRetry, 
  onBack, 
  className 
}: Pick<ErrorDisplayProps, 'error' | 'onRetry' | 'onBack' | 'className'>) {
  return (
    <ErrorDisplay
      error={error}
      type="auth"
      onRetry={onRetry}
      onBack={onBack}
      className={className}
    />
  );
}

export function NetworkError({ 
  error, 
  onRetry, 
  className 
}: Pick<ErrorDisplayProps, 'error' | 'onRetry' | 'className'>) {
  return (
    <ErrorDisplay
      error={error}
      type="network"
      onRetry={onRetry}
      className={className}
    />
  );
}
