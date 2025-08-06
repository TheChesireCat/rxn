import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnimatedCell } from '../AnimatedCell';
import { Cell } from '@/types/game';

// Mock react-spring
vi.mock('@react-spring/web', () => ({
  useSpring: vi.fn(() => [
    { 
      scale: { to: vi.fn((fn) => fn(1)) }, 
      opacity: { to: vi.fn((fn) => fn(1)) },
      borderWidth: { to: vi.fn((fn) => fn(2)) }
    }, 
    { start: vi.fn() }
  ]),
  useSpringValue: vi.fn(() => ({ 
    start: vi.fn(), 
    to: vi.fn((fn) => fn(1)) 
  })),
  animated: {
    button: 'button',
    div: 'div',
    span: 'span',
  },
}));

describe('AnimatedCell', () => {
  const mockCell: Cell = {
    orbs: 0,
    ownerId: undefined,
    criticalMass: 4,
  };

  const defaultProps = {
    cell: mockCell,
    row: 0,
    col: 0,
    isCurrentPlayerTurn: true,
    currentPlayerId: 'player-1',
    onCellClick: vi.fn(),
  };

  it('renders empty cell correctly', () => {
    render(<AnimatedCell {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Critical mass indicator
  });

  it('renders cell with orbs correctly', () => {
    const cellWithOrbs: Cell = {
      orbs: 2,
      ownerId: 'player-1',
      criticalMass: 4,
    };

    render(<AnimatedCell {...defaultProps} cell={cellWithOrbs} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Should show individual orbs for count <= 4
    const orbs = button.querySelectorAll('div[class*="rounded-full"]');
    expect(orbs).toHaveLength(2);
  });

  it('renders cell with many orbs as count', () => {
    const cellWithManyOrbs: Cell = {
      orbs: 6,
      ownerId: 'player-1',
      criticalMass: 4,
    };

    render(<AnimatedCell {...defaultProps} cell={cellWithManyOrbs} />);
    
    // Should show count for orbs > 4
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('calls onCellClick when clicked and allowed', () => {
    const onCellClick = vi.fn();
    
    render(<AnimatedCell {...defaultProps} onCellClick={onCellClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onCellClick).toHaveBeenCalledWith(0, 0);
  });

  it('does not call onCellClick when disabled', () => {
    const onCellClick = vi.fn();
    
    render(<AnimatedCell {...defaultProps} onCellClick={onCellClick} disabled />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('does not call onCellClick when not current player turn', () => {
    const onCellClick = vi.fn();
    
    render(
      <AnimatedCell 
        {...defaultProps} 
        onCellClick={onCellClick} 
        isCurrentPlayerTurn={false} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('does not call onCellClick when cell is owned by another player', () => {
    const onCellClick = vi.fn();
    const cellOwnedByOther: Cell = {
      orbs: 1,
      ownerId: 'player-2',
      criticalMass: 4,
    };
    
    render(
      <AnimatedCell 
        {...defaultProps} 
        cell={cellOwnedByOther}
        onCellClick={onCellClick} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('allows click when cell is owned by current player', () => {
    const onCellClick = vi.fn();
    const cellOwnedByCurrentPlayer: Cell = {
      orbs: 1,
      ownerId: 'player-1',
      criticalMass: 4,
    };
    
    render(
      <AnimatedCell 
        {...defaultProps} 
        cell={cellOwnedByCurrentPlayer}
        onCellClick={onCellClick} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onCellClick).toHaveBeenCalledWith(0, 0);
  });

  it('shows critical mass styling for critical cells', () => {
    const criticalCell: Cell = {
      orbs: 4,
      ownerId: 'player-1',
      criticalMass: 4,
    };
    
    render(<AnimatedCell {...defaultProps} cell={criticalCell} shouldPulse />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-red-500');
  });

  it('shows near-critical styling for near-critical cells', () => {
    const nearCriticalCell: Cell = {
      orbs: 3,
      ownerId: 'player-1',
      criticalMass: 4,
    };
    
    render(<AnimatedCell {...defaultProps} cell={nearCriticalCell} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-yellow-500');
  });
});