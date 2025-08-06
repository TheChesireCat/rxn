import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatPanel } from '../ChatPanel';

// Mock InstantDB
vi.mock('@/lib/instant', () => ({
  db: {
    useQuery: vi.fn(),
  },
}));

// Import the mocked db
import { db } from '@/lib/instant';
const mockDb = db as any;

// Mock fetch
global.fetch = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('ChatPanel', () => {
  const mockProps = {
    roomId: 'test-room-id',
    currentUserId: 'user-1',
    currentUserName: 'Test User',
    players: [
      { id: 'user-1', name: 'Test User', color: '#FF0000' },
      { id: 'user-2', name: 'Other User', color: '#00FF00' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.useQuery.mockReturnValue({
      data: { chatMessages: [] },
      isLoading: false,
    });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, messageId: 'msg-1' }),
    });
  });

  it('renders chat panel with header', () => {
    render(<ChatPanel {...mockProps} />);
    
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('0 messages')).toBeInTheDocument();
  });

  it('displays loading state when messages are loading', () => {
    mockDb.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<ChatPanel {...mockProps} />);
    
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('displays empty state when no messages', () => {
    render(<ChatPanel {...mockProps} />);
    
    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });

  it('displays chat messages correctly', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        roomId: 'test-room-id',
        userId: 'user-2',
        text: 'Hello everyone!',
        createdAt: Date.now() - 60000, // 1 minute ago
      },
      {
        id: 'msg-2',
        roomId: 'test-room-id',
        userId: 'user-1',
        text: 'Hi there!',
        createdAt: Date.now(),
      },
    ];

    mockDb.useQuery.mockReturnValue({
      data: { chatMessages: mockMessages },
      isLoading: false,
    });

    render(<ChatPanel {...mockProps} />);
    
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('Other User')).toBeInTheDocument(); // Sender name for other user's message
    expect(screen.getByText('2 messages')).toBeInTheDocument();
  });

  it('allows typing and sending messages', async () => {
    render(<ChatPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    // Initially send button should be disabled
    expect(sendButton).toBeDisabled();

    // Type a message
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(sendButton).not.toBeDisabled();

    // Send the message
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: 'test-room-id',
          userId: 'user-1',
          text: 'Test message',
        }),
      });
    });

    // Input should be cleared after sending
    expect(input).toHaveValue('');
  });

  it('prevents sending empty messages', () => {
    render(<ChatPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    // Try to send empty message
    fireEvent.change(input, { target: { value: '   ' } }); // Only whitespace
    expect(sendButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '' } }); // Empty
    expect(sendButton).toBeDisabled();
  });

  it('shows character count', () => {
    render(<ChatPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    
    expect(screen.getByText('0/500 characters')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(screen.getByText('5/500 characters')).toBeInTheDocument();
  });
});