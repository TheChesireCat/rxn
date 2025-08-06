import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Cell } from '../Cell';
import { Cell as CellType } from '@/types/game';

describe('Cell', () => {
  const mockOnCellClick = vi.fn();
  const currentPlayerId = 'player1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createCell = (overrides: Partial<CellType> = {}): CellType => ({
    orbs: 0,
    ownerId: undefined,
    criticalMass: 4,
    ...overrides,
  });

  it('renders empty cell with critical mass indicator', () => {
    const cell = createCell({ criticalMass: 3 });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders cell with orbs', () => {
    const cell = createCell({ orbs: 2, ownerId: currentPlayerId });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    // Should render 2 orb elements
    const orbs = screen.getAllByRole('generic').filter(el => 
      el.className.includes('rounded-full') && el.className.includes('w-2')
    );
    expect(orbs).toHaveLength(2);
  });

  it('renders cell with many orbs as count', () => {
    const cell = createCell({ orbs: 8, ownerId: currentPlayerId });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('calls onCellClick when clicked and clickable', () => {
    const cell = createCell();
    
    render(
      <Cell
        cell={cell}
        row={1}
        col={2}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnCellClick).toHaveBeenCalledWith(1, 2);
  });

  it('does not call onCellClick when not current player turn', () => {
    const cell = createCell();
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={false}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('does not call onCellClick when cell is owned by another player', () => {
    const cell = createCell({ ownerId: 'other-player', orbs: 1 });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('allows click when cell is owned by current player', () => {
    const cell = createCell({ ownerId: currentPlayerId, orbs: 1 });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnCellClick).toHaveBeenCalledWith(0, 0);
  });

  it('shows critical mass warning styling', () => {
    const cell = createCell({ orbs: 3, criticalMass: 4, ownerId: currentPlayerId });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('border-yellow-500');
  });

  it('shows critical styling when at critical mass', () => {
    const cell = createCell({ orbs: 4, criticalMass: 4, ownerId: currentPlayerId });
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('border-red-500');
    expect(button.className).toContain('animate-pulse');
  });

  it('is disabled when disabled prop is true', () => {
    const cell = createCell();
    
    render(
      <Cell
        cell={cell}
        row={0}
        col={0}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    const cell = createCell({ orbs: 2, criticalMass: 3, ownerId: currentPlayerId });
    
    render(
      <Cell
        cell={cell}
        row={1}
        col={2}
        isCurrentPlayerTurn={true}
        currentPlayerId={currentPlayerId}
        onCellClick={mockOnCellClick}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 
      'Cell at row 2, column 3. 2 orbs. Owned by player. Critical mass: 3'
    );
  });
});