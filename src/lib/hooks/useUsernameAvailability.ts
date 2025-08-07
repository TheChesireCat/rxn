import { useState, useEffect, useCallback, useRef } from 'react';

export interface UsernameAvailabilityResult {
  available: boolean;
  isClaimed: boolean;
  isActive: boolean;
  lastActive?: number;
  reason?: string;
  message?: string;
}

export interface UsernameValidationState {
  isChecking: boolean;
  isValid: boolean;
  result: UsernameAvailabilityResult | null;
  error: string | null;
}

const DEBOUNCE_DELAY = 300; // 300ms debounce

export function useUsernameAvailability() {
  const [state, setState] = useState<UsernameValidationState>({
    isChecking: false,
    isValid: false,
    result: null,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateUsernameFormat = (username: string): string | null => {
    if (!username.trim()) {
      return null; // Don't show error for empty input
    }
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (username.length > 20) {
      return 'Username must be 20 characters or less';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, _ and -';
    }
    
    return null;
  };

  const checkAvailability = useCallback(async (username: string): Promise<void> => {
    try {
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Failed to check username availability');
      }

      const result: UsernameAvailabilityResult = await response.json();
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        isValid: result.available,
        result,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isChecking: false,
        isValid: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to check availability',
      }));
    }
  }, []);

  const checkUsername = useCallback((username: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Validate format first
    const formatError = validateUsernameFormat(username);
    
    if (formatError) {
      setState(prev => ({
        ...prev,
        isChecking: false,
        isValid: false,
        result: null,
        error: formatError,
      }));
      return;
    }

    if (!username.trim()) {
      setState(prev => ({
        ...prev,
        isChecking: false,
        isValid: false,
        result: null,
        error: null,
      }));
      return;
    }

    // Set checking state immediately for valid usernames
    setState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
      result: null,
    }));

    // Debounce the actual API call
    timeoutRef.current = setTimeout(() => {
      checkAvailability(username);
    }, DEBOUNCE_DELAY);
  }, [checkAvailability]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    checkUsername,
    validateFormat: validateUsernameFormat,
  };
}