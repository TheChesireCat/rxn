import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useReactions } from '../useReactions';

// Mock the instant client
const mockRoom = {
  subscribeTopic: jest.fn(),
  publishTopic: jest.fn(),
};

const mockGetGameRoom = jest.fn(() => mockRoom);

jest.mock('@/lib/instant', () => ({
  getGameRoom: () => mockGetGameRoom(),
}));

describe('useReactions', () => {
  const mockProps = {
    roomId: 'test-room',
    currentUserId: 'user-1',
    currentUserName: 'Alice',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom.subscribeTopic.mockReturnValue(() => {});
  });

  it('initializes with empty reactions', () => {
    const { result } = renderHook(() => useReactions(mockProps));

    expect(result.current.reactions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('subscribes to reactions topic on mount', () => {
    renderHook(() => useReactions(mockProps));

    expect(mockRoom.subscribeTopic).toHaveBeenCalledWith(
      'reactions',
      expect.any(Function)
    );
  });

  it('sends reaction with correct data', () => {
    const { result } = renderHook(() => useReactions(mockProps));

    act(() => {
      result.current.sendReaction('😀', 50, 75);
    });

    expect(mockRoom.publishTopic).toHaveBeenCalledWith('reactions', {
      emoji: '😀',
      senderId: 'user-1',
      senderName: 'Alice',
      timestamp: expect.any(Number),
      x: 50,
      y: 75,
    });
  });

  it('sends reaction without position', () => {
    const { result } = renderHook(() => useReactions(mockProps));

    act(() => {
      result.current.sendReaction('❤️');
    });

    expect(mockRoom.publishTopic).toHaveBeenCalledWith('reactions', {
      emoji: '❤️',
      senderId: 'user-1',
      senderName: 'Alice',
      timestamp: expect.any(Number),
      x: undefined,
      y: undefined,
    });
  });

  it('handles received reactions', () => {
    let messageHandler: (message: any, peer: any) => void;
    mockRoom.subscribeTopic.mockImplementation((topic, handler) => {
      messageHandler = handler;
      return () => {};
    });

    const { result } = renderHook(() => useReactions(mockProps));

    const reactionMessage = {
      emoji: '🎉',
      senderId: 'user-2',
      senderName: 'Bob',
      timestamp: 1234567890,
      x: 25,
      y: 50,
    };

    act(() => {
      messageHandler(reactionMessage, null);
    });

    expect(result.current.reactions).toHaveLength(1);
    expect(result.current.reactions[0]).toEqual({
      id: 'user-2-1234567890',
      emoji: '🎉',
      senderId: 'user-2',
      senderName: 'Bob',
      timestamp: 1234567890,
      x: 25,
      y: 50,
    });
  });

  it('prevents duplicate reactions', () => {
    let messageHandler: (message: any, peer: any) => void;
    mockRoom.subscribeTopic.mockImplementation((topic, handler) => {
      messageHandler = handler;
      return () => {};
    });

    const { result } = renderHook(() => useReactions(mockProps));

    const reactionMessage = {
      emoji: '🎉',
      senderId: 'user-2',
      senderName: 'Bob',
      timestamp: 1234567890,
      x: 25,
      y: 50,
    };

    act(() => {
      messageHandler(reactionMessage, null);
      messageHandler(reactionMessage, null); // Send same reaction twice
    });

    expect(result.current.reactions).toHaveLength(1);
  });

  it('handles error when room is not available', () => {
    mockGetGameRoom.mockReturnValue(null);

    const { result } = renderHook(() => useReactions(mockProps));

    act(() => {
      result.current.sendReaction('😀');
    });

    expect(result.current.error).toBe('Room not available');
    expect(mockRoom.publishTopic).not.toHaveBeenCalled();
  });

  it('handles error when publishing fails', () => {
    mockRoom.publishTopic.mockImplementation(() => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() => useReactions(mockProps));

    act(() => {
      result.current.sendReaction('😀');
    });

    expect(result.current.error).toBe('Failed to send reaction');
  });

  it('cleans up subscription on unmount', () => {
    const unsubscribe = jest.fn();
    mockRoom.subscribeTopic.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useReactions(mockProps));

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});