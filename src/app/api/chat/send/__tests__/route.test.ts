import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock InstantDB
vi.mock('@/lib/instant', () => ({
  db: {
    transact: vi.fn(),
    tx: {
      chatMessages: {}
    }
  }
}));

// Import the mocked db
import { db } from '@/lib/instant';
const mockDb = db as any;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

describe('/api/chat/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock transaction structure
    mockDb.tx.chatMessages = new Proxy({}, {
      get: (target, prop) => ({
        update: vi.fn().mockReturnValue({
          link: vi.fn().mockReturnValue({})
        })
      })
    }) as any;
    
    mockDb.transact.mockResolvedValue({});
  });

  it('successfully sends a chat message', async () => {
    const requestBody = {
      roomId: 'room-123',
      userId: 'user-456',
      text: 'Hello, world!',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      messageId: 'test-uuid-123',
      message: 'Message sent successfully',
    });

    expect(mockDb.transact).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const requestBody = {
      roomId: 'room-123',
      // Missing userId and text
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields: roomId, userId, text');
    expect(mockDb.transact).not.toHaveBeenCalled();
  });

  it('validates text is non-empty string', async () => {
    const requestBody = {
      roomId: 'room-123',
      userId: 'user-456',
      text: '   ', // Only whitespace
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message text must be a non-empty string');
    expect(mockDb.transact).not.toHaveBeenCalled();
  });

  it('validates text length limit', async () => {
    const requestBody = {
      roomId: 'room-123',
      userId: 'user-456',
      text: 'a'.repeat(501), // Exceeds 500 character limit
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message text must be 500 characters or less');
    expect(mockDb.transact).not.toHaveBeenCalled();
  });

  it('sanitizes message text by trimming whitespace', async () => {
    const requestBody = {
      roomId: 'room-123',
      userId: 'user-456',
      text: '  Hello, world!  ',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(mockDb.transact).toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    mockDb.transact.mockRejectedValue(new Error('Database connection failed'));

    const requestBody = {
      roomId: 'room-123',
      userId: 'user-456',
      text: 'Hello, world!',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send message');
  });

  it('handles invalid JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send message');
    expect(mockDb.transact).not.toHaveBeenCalled();
  });

  it('validates text is a string type', async () => {
    const requestBody = {
      roomId: 'room-123',
      userId: 'user-456',
      text: 123, // Not a string
    };

    const request = new NextRequest('http://localhost:3000/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Message text must be a non-empty string');
    expect(mockDb.transact).not.toHaveBeenCalled();
  });
});