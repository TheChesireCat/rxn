import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnreadMessages } from '../useUnreadMessages';
import { db } from '@/lib/instant';

// Mock InstantDB
vi.mock('@/lib/instant', () => ({
  db: {
    useQuery: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component to test the hook
function TestComponent({ roomId, currentUserId, isChatOpen }: {
  roomId: string | null;
  currentUserId: string;
  isChatOpen: boolean;
}) {
  const { unreadCount, markAsRead } = useUnreadMessages({
    roomId,
    currentUserId,
    isChatOpen
  });

  return (
    <div>
      <span data-testid="unread-count">{unreadCount}</span>
      <button data-testid="mark-read" onClick={markAsRead}>
        Mark Read
      </button>
    </div>
  );
}

describe('useUnreadMessages', () => {
  const mockRoomId = 'test-room-123';
  const mockUserId = 'user-456';
  const mockMessages = [
    {
      id: 'msg1',
      roomId: mockRoomId,
      userId: 'other-user',
      text: 'Hello',
      createdAt: 1000
    },
    {
      id: 'msg2',
      roomId: mockRoomId,
      userId: mockUserId,
      text: 'Hi back',
      createdAt: 2000
    },
    {
      id: 'msg3',
      roomId: mockRoomId,
      userId: 'other-user',
      text: 'How are you?',
      createdAt: 3000
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should count unread messages from other users', async () => {
    // Mock query response
    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: mockMessages }
    });

    // Mock no previous last seen timestamp
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      // Should count 2 messages from other users (msg1 and msg3)
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
    });
  });

  it('should not count own messages as unread', async () => {
    const ownMessages = [
      {
        id: 'msg1',
        roomId: mockRoomId,
        userId: mockUserId,
        text: 'My message',
        createdAt: 1000
      }
    ];

    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: ownMessages }
    });

    render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should reset count when chat is opened', async () => {
    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: mockMessages }
    });

    const { rerender } = render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
    });

    // Open chat
    rerender(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `chat-last-seen-${mockRoomId}-${mockUserId}`,
        expect.any(String)
      );
    });
  });

  it('should auto-mark messages as read when they arrive while chat is open', async () => {
    // Start with chat open and some messages
    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: mockMessages }
    });

    const { rerender } = render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    // Add a new message while chat is still open
    const newMessage = {
      id: 'msg4',
      roomId: mockRoomId,
      userId: 'other-user',
      text: 'New message while chat open',
      createdAt: 4000
    };

    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: [...mockMessages, newMessage] }
    });

    rerender(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={true}
      />
    );

    await waitFor(() => {
      // Should still be 0 because it was auto-marked as read
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      // Should have updated localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `chat-last-seen-${mockRoomId}-${mockUserId}`,
        expect.any(String)
      );
    });
  });

  it('should respect last seen timestamp from localStorage', async () => {
    // Set last seen timestamp to after msg1 but before msg3
    const lastSeen = 1500;
    mockLocalStorage.getItem.mockReturnValue(lastSeen.toString());

    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: mockMessages }
    });

    render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      // Should only count msg3 (created at 3000, after lastSeen 1500)
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });
  });

  it('should handle no roomId gracefully', async () => {
    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: [] }
    });

    render(
      <TestComponent
        roomId={null}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should filter messages by room', async () => {
    const messagesFromDifferentRooms = [
      ...mockMessages,
      {
        id: 'msg4',
        roomId: 'different-room',
        userId: 'other-user',
        text: 'Different room message',
        createdAt: 4000
      }
    ];

    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: messagesFromDifferentRooms }
    });

    render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      // Should still be 2 (only messages from mockRoomId)
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
    });
  });

  it('should not auto-mark messages when chat is closed', async () => {
    // Start with chat closed
    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: mockMessages }
    });

    const { rerender } = render(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
    });

    // Add a new message while chat is closed
    const newMessage = {
      id: 'msg4',
      roomId: mockRoomId,
      userId: 'other-user',
      text: 'New message while chat closed',
      createdAt: 4000
    };

    (db.useQuery as any).mockReturnValue({
      data: { chatMessages: [...mockMessages, newMessage] }
    });

    rerender(
      <TestComponent
        roomId={mockRoomId}
        currentUserId={mockUserId}
        isChatOpen={false}
      />
    );

    await waitFor(() => {
      // Should be 3 (including the new unread message)
      expect(screen.getByTestId('unread-count')).toHaveTextContent('3');
    });
  });
});
