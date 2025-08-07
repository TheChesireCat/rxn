import React from 'react';
import { render, screen } from '@testing-library/react';
import { UsernameAvailabilityIndicator } from '../UsernameAvailabilityIndicator';
import type { UsernameValidationState } from '@/lib/hooks/useUsernameAvailability';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';

describe('UsernameAvailabilityIndicator', () => {
  const defaultState: UsernameValidationState = {
    isChecking: false,
    isValid: false,
    result: null,
    error: null,
  };

  it('should render nothing for empty username', () => {
    const { container } = render(
      <UsernameAvailabilityIndicator 
        state={defaultState} 
        username="" 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing for whitespace-only username', () => {
    const { container } = render(
      <UsernameAvailabilityIndicator 
        state={defaultState} 
        username="   " 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when checking', () => {
    const checkingState: UsernameValidationState = {
      ...defaultState,
      isChecking: true,
    };

    render(
      <UsernameAvailabilityIndicator 
        state={checkingState} 
        username="testuser" 
      />
    );

    expect(screen.getByText('Checking availability...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show format validation error', () => {
    const errorState: UsernameValidationState = {
      ...defaultState,
      error: 'Username must be at least 3 characters',
    };

    render(
      <UsernameAvailabilityIndicator 
        state={errorState} 
        username="ab" 
      />
    );

    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getByText('Username must be at least 3 characters')).toHaveClass('text-red-600');
  });

  it('should show available username with green checkmark', () => {
    const availableState: UsernameValidationState = {
      ...defaultState,
      isValid: true,
      result: {
        available: true,
        isClaimed: false,
        isActive: false,
        message: 'Username is available',
      },
    };

    render(
      <UsernameAvailabilityIndicator 
        state={availableState} 
        username="availableuser" 
      />
    );

    expect(screen.getByText('Available! This username is ready to use.')).toBeInTheDocument();
    expect(screen.getByText('Available! This username is ready to use.')).toHaveClass('text-green-600');
  });

  it('should show claimed username with lock icon', () => {
    const claimedState: UsernameValidationState = {
      ...defaultState,
      result: {
        available: false,
        isClaimed: true,
        isActive: false,
        message: 'This username is registered. Sign in to use it.',
      },
    };

    render(
      <UsernameAvailabilityIndicator 
        state={claimedState} 
        username="claimeduser" 
      />
    );

    expect(screen.getByText('This username is registered. Sign in to use it.')).toBeInTheDocument();
    expect(screen.getByText('This username is registered. Sign in to use it.')).toHaveClass('text-orange-600');
  });

  it('should show active username with clock icon and time info', () => {
    const lastActive = Date.now() - 15 * 60 * 1000; // 15 minutes ago
    const activeState: UsernameValidationState = {
      ...defaultState,
      result: {
        available: false,
        isClaimed: false,
        isActive: true,
        lastActive,
        message: 'This username is currently in use.',
      },
    };

    render(
      <UsernameAvailabilityIndicator 
        state={activeState} 
        username="activeuser" 
      />
    );

    expect(screen.getByText('Currently in use (active 15m ago). Try another.')).toBeInTheDocument();
    expect(screen.getByText('Currently in use (active 15m ago). Try another.')).toHaveClass('text-yellow-600');
  });

  it('should show generic unavailable message for other cases', () => {
    const unavailableState: UsernameValidationState = {
      ...defaultState,
      result: {
        available: false,
        isClaimed: false,
        isActive: false,
        message: 'This username is not available.',
      },
    };

    render(
      <UsernameAvailabilityIndicator 
        state={unavailableState} 
        username="unavailableuser" 
      />
    );

    expect(screen.getByText('This username is not available.')).toBeInTheDocument();
    expect(screen.getByText('This username is not available.')).toHaveClass('text-red-600');
  });

  it('should show default message when no specific message provided', () => {
    const unavailableState: UsernameValidationState = {
      ...defaultState,
      result: {
        available: false,
        isClaimed: false,
        isActive: false,
      },
    };

    render(
      <UsernameAvailabilityIndicator 
        state={unavailableState} 
        username="unavailableuser" 
      />
    );

    expect(screen.getByText('This username is not available.')).toBeInTheDocument();
  });

  it('should handle dark mode classes', () => {
    const availableState: UsernameValidationState = {
      ...defaultState,
      isValid: true,
      result: {
        available: true,
        isClaimed: false,
        isActive: false,
        message: 'Username is available',
      },
    };

    render(
      <UsernameAvailabilityIndicator 
        state={availableState} 
        username="availableuser" 
      />
    );

    const element = screen.getByText('Available! This username is ready to use.');
    expect(element).toHaveClass('dark:text-green-400');
  });

  it('should calculate minutes ago correctly for different time ranges', () => {
    // Test 1 minute ago
    const oneMinuteAgo = Date.now() - 1 * 60 * 1000;
    const activeState1: UsernameValidationState = {
      ...defaultState,
      result: {
        available: false,
        isClaimed: false,
        isActive: true,
        lastActive: oneMinuteAgo,
      },
    };

    const { rerender } = render(
      <UsernameAvailabilityIndicator 
        state={activeState1} 
        username="activeuser" 
      />
    );

    expect(screen.getByText('Currently in use (active 1m ago). Try another.')).toBeInTheDocument();

    // Test 0 minutes ago (less than 1 minute)
    const justNow = Date.now() - 30 * 1000; // 30 seconds ago
    const activeState2: UsernameValidationState = {
      ...defaultState,
      result: {
        available: false,
        isClaimed: false,
        isActive: true,
        lastActive: justNow,
      },
    };

    rerender(
      <UsernameAvailabilityIndicator 
        state={activeState2} 
        username="activeuser" 
      />
    );

    expect(screen.getByText('Currently in use (active 0m ago). Try another.')).toBeInTheDocument();
  });
});