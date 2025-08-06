import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactionOverlay, Reaction } from '../ReactionOverlay';

// Mock react-spring
jest.mock('@react-spring/web', () => ({
  animated: {
    div: ({ children, style, ...props }: any) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
  },
  useSpring: () => ({}),
  useTransition: (items: any[]) => 
    items.map(item => [
      {
        opacity: 1,
        transform: 'scale(1) translateY(-40px)',
      },
      item,
    ]),
}));

describe('ReactionOverlay', () => {
  const mockReactions: Reaction[] = [
    {
      id: 'reaction-1',
      emoji: '😀',
      senderId: 'user-1',
      senderName: 'Alice',
      timestamp: Date.now(),
      x: 50,
      y: 50,
    },
    {
      id: 'reaction-2',
      emoji: '❤️',
      senderId: 'user-2',
      senderName: 'Bob',
      timestamp: Date.now() + 1000,
      x: 30,
      y: 70,
    },
  ];

  it('renders nothing when no reactions', () => {
    const { container } = render(<ReactionOverlay reactions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders reactions with emojis and sender names', async () => {
    render(<ReactionOverlay reactions={mockReactions} />);

    await waitFor(() => {
      expect(screen.getByText('😀')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('positions reactions correctly', async () => {
    render(<ReactionOverlay reactions={mockReactions} />);

    await waitFor(() => {
      const reactionElements = screen.getAllByText(/😀|❤️/);
      expect(reactionElements).toHaveLength(2);
    });
  });

  it('handles reactions without specified positions', async () => {
    const reactionsWithoutPosition: Reaction[] = [
      {
        id: 'reaction-3',
        emoji: '🎉',
        senderId: 'user-3',
        senderName: 'Charlie',
        timestamp: Date.now(),
      },
    ];

    render(<ReactionOverlay reactions={reactionsWithoutPosition} />);

    await waitFor(() => {
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('truncates long sender names', async () => {
    const reactionWithLongName: Reaction[] = [
      {
        id: 'reaction-4',
        emoji: '👍',
        senderId: 'user-4',
        senderName: 'Very Long Username That Should Be Truncated',
        timestamp: Date.now(),
        x: 25,
        y: 25,
      },
    ];

    render(<ReactionOverlay reactions={reactionWithLongName} />);

    await waitFor(() => {
      expect(screen.getByText('👍')).toBeInTheDocument();
      const nameElement = screen.getByText('Very Long Username That Should Be Truncated');
      expect(nameElement).toHaveClass('truncate', 'max-w-[100px]');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReactionOverlay reactions={mockReactions} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('sets proper z-index for overlay', async () => {
    render(<ReactionOverlay reactions={mockReactions} />);

    await waitFor(() => {
      const reactionElements = screen.getAllByText(/😀|❤️/);
      reactionElements.forEach(element => {
        const parentDiv = element.closest('[style*="zIndex"]');
        expect(parentDiv).toHaveStyle('z-index: 50');
      });
    });
  });
});