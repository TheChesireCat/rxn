'use client';

import React from 'react';

interface ProgressIndicatorProps {
  currentStep: 'username' | 'email' | 'code' | 'complete';
  isNewClaim?: boolean;
  className?: string;
}

interface LoadingStateProps {
  message: string;
  submessage?: string;
  progress?: number; // 0-100 percentage
  className?: string;
}

/**
 * Multi-step progress indicator for authentication flow
 */
export function ProgressIndicator({ currentStep, isNewClaim = false, className = '' }: ProgressIndicatorProps) {
  const steps = [
    { key: 'username', label: 'Username', icon: '👤' },
    { key: 'email', label: isNewClaim ? 'Email' : 'Lookup', icon: '📧' },
    { key: 'code', label: 'Verify', icon: '🔐' },
    { key: 'complete', label: isNewClaim ? 'Claim' : 'SignIn', icon: '✅' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step Circle */}
            <div className={`
              flex items-center justify-center w-4 h-4 rounded-full text-sm font-medium transition-all duration-200
              ${isActive ? 'bg-blue-600 text-white scale-110' : ''}
              ${isCompleted ? 'bg-green-600 text-white' : ''}
              ${isUpcoming ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
            `}>
              {isCompleted ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>

            {/* Step Label */}
            <div className={`
              ml-2 text-xs font-medium transition-colors duration-200
              ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}
              ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}
              ${isUpcoming ? 'text-gray-500 dark:text-gray-400' : ''}
            `}>
              {step.label}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`
                w-6 h-0.5 ml-2 transition-colors duration-200
                ${isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Enhanced loading state with progress and descriptive messages
 */
export function LoadingState({ message, submessage, progress, className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      {/* Spinner */}
      <div className="relative">
        <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-8 h-8 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Progress Ring */}
        {progress !== undefined && (
          <div className="absolute inset-0">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 dark:text-gray-600"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-blue-600"
                strokeDasharray={`${(progress / 100) * 87.96} 87.96`}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {message}
        </p>
        {submessage && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {submessage}
          </p>
        )}
        {progress !== undefined && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {Math.round(progress)}% complete
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Step-specific loading messages
 */
export function getLoadingMessage(step: string, action: string): { message: string; submessage?: string } {
  const messages: { [key: string]: { [action: string]: { message: string; submessage?: string } } } = {
    username: {
      checking: {
        message: 'Checking username availability...',
        submessage: 'This may take a moment'
      },
      processing: {
        message: 'Processing username...',
        submessage: 'Determining if username is claimed'
      }
    },
    email: {
      sending: {
        message: 'Sending verification code...',
        submessage: 'Check your email in a moment'
      },
      validating: {
        message: 'Validating email address...',
        submessage: 'Ensuring email format is correct'
      }
    },
    code: {
      verifying: {
        message: 'Verifying your code...',
        submessage: 'Checking with secure servers'
      },
      authenticating: {
        message: 'Authenticating...',
        submessage: 'Signing you in securely'
      },
      claiming: {
        message: 'Claiming your username...',
        submessage: 'Creating your permanent account'
      }
    },
    general: {
      loading: {
        message: 'Loading...',
        submessage: 'Please wait a moment'
      },
      processing: {
        message: 'Processing...',
        submessage: 'Working on your request'
      }
    }
  };

  return messages[step]?.[action] || messages.general.loading;
}

/**
 * Comprehensive loading component that combines progress indicator with loading state
 */
export function AuthLoadingState({ 
  currentStep, 
  action, 
  isNewClaim = false, 
  progress,
  className = '' 
}: {
  currentStep: 'username' | 'email' | 'code' | 'complete';
  action: string;
  isNewClaim?: boolean;
  progress?: number;
  className?: string;
}) {
  const { message, submessage } = getLoadingMessage(currentStep, action);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* <ProgressIndicator currentStep={currentStep} isNewClaim={isNewClaim} /> */}
      <LoadingState 
        message={message} 
        submessage={submessage} 
        progress={progress}
      />
    </div>
  );
}
