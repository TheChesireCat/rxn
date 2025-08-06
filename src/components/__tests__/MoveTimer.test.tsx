import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MoveTimer } from '../MoveTimer';

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('MoveTimer', () => {
  const mockOnTimeout = vi.fn();

  beforeEach(() => {
    mockOnTimeout.mockClear();
  });

  it('renders nothing when no time limit is set', () => {
    const { container } = render(
      <MoveTimer
        turnStartedAt={Date.now()}
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when game is not active', () => {
    const { container } = render(
      <MoveTimer
        turnStartedAt={Date.now()}
        moveTimeLimit={30}
        isCurrentPlayerTurn={true}
        isGameActive={false}
        onTimeout={mockOnTimeout}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('displays correct initial time', () => {
    const turnStart = Date.now();
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={30} // 30 seconds
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('Your Turn')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('shows waiting message when not current player turn', () => {
    const turnStart = Date.now();
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={30}
        isCurrentPlayerTurn={false}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('Move Time')).toBeInTheDocument();
    expect(screen.getByText('Waiting for player')).toBeInTheDocument();
  });

  it('counts down correctly', () => {
    const turnStart = Date.now();
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={10} // 10 seconds
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('10s')).toBeInTheDocument();

    // Advance time by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('7s')).toBeInTheDocument();

    // Advance time by another 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('2s')).toBeInTheDocument();
  });

  it('calls onTimeout when time expires', () => {
    const turnStart = Date.now() - 9000; // Started 9 seconds ago
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={10} // 10 seconds
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    expect(screen.getByText('1s')).toBeInTheDocument();

    // Advance time by 1 second to trigger timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Time's up!")).toBeInTheDocument();
    expect(mockOnTimeout).toHaveBeenCalledTimes(1);
  });

  it('shows correct color based on time remaining', () => {
    const turnStart = Date.now();
    
    const { rerender } = render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={20} // 20 seconds
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    // Should be blue initially (> 50% remaining)
    const timeDisplay = screen.getByText('20s');
    expect(timeDisplay).toHaveClass('text-blue-600');

    // Advance to 8 seconds remaining (40% remaining)
    rerender(
      <MoveTimer
        turnStartedAt={turnStart - 12000} // 12 seconds ago
        moveTimeLimit={20}
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    const yellowTimeDisplay = screen.getByText('8s');
    expect(yellowTimeDisplay).toHaveClass('text-yellow-600');

    // Advance to 3 seconds remaining (15% remaining)
    rerender(
      <MoveTimer
        turnStartedAt={turnStart - 17000} // 17 seconds ago
        moveTimeLimit={20}
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    const redTimeDisplay = screen.getByText('3s');
    expect(redTimeDisplay).toHaveClass('text-red-600');
  });

  it('shows pulsing animation when time is low and is current player turn', () => {
    const turnStart = Date.now() - 17000; // Started 17 seconds ago (3 seconds remaining)
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={20}
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    const container = document.querySelector('.animate-pulse');
    expect(container).toBeInTheDocument();
  });

  it('does not show pulsing animation when not current player turn', () => {
    const turnStart = Date.now() - 17000; // Started 17 seconds ago (3 seconds remaining)
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={20}
        isCurrentPlayerTurn={false}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    const container = document.querySelector('.animate-pulse');
    expect(container).not.toBeInTheDocument();
  });

  it('updates progress bar correctly', () => {
    const turnStart = Date.now() - 10000; // Started 10 seconds ago
    
    render(
      <MoveTimer
        turnStartedAt={turnStart}
        moveTimeLimit={20} // 20 seconds total
        isCurrentPlayerTurn={true}
        isGameActive={true}
        onTimeout={mockOnTimeout}
      />
    );

    // Should show 50% progress (10 seconds remaining out of 20)
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });
});