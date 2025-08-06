import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactionPicker } from '../ReactionPicker';

describe('ReactionPicker', () => {
  const mockOnReactionSelect = jest.fn();

  beforeEach(() => {
    mockOnReactionSelect.mockClear();
  });

  it('renders reaction button', () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} />);
    
    const button = screen.getByTitle('Add reaction');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('😊');
  });

  it('opens emoji picker when button is clicked', async () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} />);
    
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTitle('React with 😀')).toBeInTheDocument();
    });
  });

  it('calls onReactionSelect when emoji is clicked', async () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} />);
    
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    await waitFor(() => {
      const emojiButton = screen.getByTitle('React with 😀');
      fireEvent.click(emojiButton);
    });

    expect(mockOnReactionSelect).toHaveBeenCalledWith('😀');
  });

  it('closes picker after emoji selection', async () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} />);
    
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    await waitFor(() => {
      const emojiButton = screen.getByTitle('React with 😀');
      fireEvent.click(emojiButton);
    });

    await waitFor(() => {
      expect(screen.queryByTitle('React with 😀')).not.toBeInTheDocument();
    });
  });

  it('closes picker when backdrop is clicked', async () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} />);
    
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTitle('React with 😀')).toBeInTheDocument();
    });

    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByTitle('React with 😀')).not.toBeInTheDocument();
    });
  });

  it('disables button when disabled prop is true', () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} disabled={true} />);
    
    const button = screen.getByTitle('Add reaction');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('does not open picker when disabled', () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} disabled={true} />);
    
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    expect(screen.queryByTitle('React with 😀')).not.toBeInTheDocument();
  });

  it('renders all predefined emojis', async () => {
    render(<ReactionPicker onReactionSelect={mockOnReactionSelect} />);
    
    const button = screen.getByTitle('Add reaction');
    fireEvent.click(button);

    await waitFor(() => {
      // Check for a few key emojis
      expect(screen.getByTitle('React with 😀')).toBeInTheDocument();
      expect(screen.getByTitle('React with 😂')).toBeInTheDocument();
      expect(screen.getByTitle('React with ❤️')).toBeInTheDocument();
      expect(screen.getByTitle('React with 👍')).toBeInTheDocument();
    });
  });
});