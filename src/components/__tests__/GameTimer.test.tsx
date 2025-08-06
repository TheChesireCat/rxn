import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameTimer } from '../GameTimer';

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('GameTimer', () => {
  const mockOnTimeout = vi.fn();

  beforeEach(() => {
    mockOnTimeout.mockClear();
  });

  it('renders nothing when no time limit is set', () => {
    const { container } = render(
      <GameTimer
        gameStartTime={Date.now()}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when game is not active', () => {
    const { container } = render(
      <GameTimer
        gameStartTime={Date.now()}
        gameTimeLimit={10}
        isGameActive={false}
        onTimeout={mockOnTimeout}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('displays correct initial time', () => {
    const startTime = Date.now();
    
    render(
      <GameTimer
        gameStartTime={startTime}
        gameTimeLimit={5} // 5 minutes
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('Game Time')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('counts down correctly', () => {
    const startTime = Date.now();
    
    render(
      <GameTimer
        gameStartTime={startTime}
        gameTimeLimit={2} // 2 minutes
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('02:00')).toBeInTheDocument();

    // Advance time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText('01:30')).toBeInTheDocument();

    // Advance time by another 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByText('00:30')).toBeInTheDocument();
  });

  it('calls onTimeout when time expires', () => {
    const startTime = Date.now() - 119000; // Started 1:59 ago
    
    render(
      <GameTimer
        gameStartTime={startTime}
        gameTimeLimit={2} // 2 minutes
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('00:01')).toBeInTheDocument();

    // Advance time by 1 second to trigger timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText("Time's up!")).toBeInTheDocument();
    expect(mockOnTimeout).toHaveBeenCalledTimes(1);
  });

  it('shows correct color based on time remaining', () => {
    const startTime = Date.now();
    
    const { rerender } = render(
      <GameTimer
        gameStartTime={startTime}
        gameTimeLimit={10} // 10 minutes
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    // Should be green initially (> 50% remaining)
    const timeDisplay = screen.getByText('10:00');
    expect(timeDisplay).toHaveClass('text-green-600');

    // Advance to 3 minutes remaining (30% remaining)
    rerender(
      <GameTimer
        gameStartTime={startTime - 420000} // 7 minutes ago
        gameTimeLimit={10}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    const yellowTimeDisplay = screen.getByText('03:00');
    expect(yellowTimeDisplay).toHaveClass('text-yellow-600');

    // Advance to 1 minute remaining (10% remaining)
    rerender(
      <GameTimer
        gameStartTime={startTime - 540000} // 9 minutes ago
        gameTimeLimit={10}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    const redTimeDisplay = screen.getByText('01:00');
    expect(redTimeDisplay).toHaveClass('text-red-600');
  });

  it('updates progress bar correctly', () => {
    const startTime = Date.now() - 300000; // Started 5 minutes ago
    
    render(
      <GameTimer
        gameStartTime={startTime}
        gameTimeLimit={10} // 10 minutes total
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    // Should show 50% progress (5 minutes remaining out of 10)
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });
});