'use client';

import { useState } from 'react';
import { db } from '@/lib/instant';

export function TestChatQuery({ roomId }: { roomId: string }) {
  const [testMessage, setTestMessage] = useState('');

  // Try different query approaches
  
  // Approach 1: Original query
  const query1 = db.useQuery({
    chatMessages: {
      $: {
        where: { roomId },
        order: { createdAt: 'asc' }
      }
    }
  });

  // Approach 2: Query all messages (no filter)
  const query2 = db.useQuery({
    chatMessages: {}
  });

  // Approach 3: Query with explicit limit
  const query3 = db.useQuery({
    chatMessages: {
      $: {
        where: { roomId },
        limit: 100
      }
    }
  });

  console.log('Test Query Results:', {
    query1: {
      data: query1.data,
      loading: query1.isLoading,
      error: query1.error
    },
    query2: {
      data: query2.data,
      loading: query2.isLoading,
      error: query2.error
    },
    query3: {
      data: query3.data,
      loading: query3.isLoading,
      error: query3.error
    }
  });

  // Test creating a message directly from client
  const createTestMessage = async () => {
    const messageId = crypto.randomUUID();
    try {
      await db.transact(
        db.tx.chatMessages[messageId].update({
          roomId,
          userId: 'test-user',
          text: testMessage || 'Test message from client',
          createdAt: Date.now(),
        })
      );
      console.log('Test message created successfully');
      setTestMessage('');
    } catch (error) {
      console.error('Error creating test message:', error);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Chat Query Test</h3>
      <div>Room ID: {roomId}</div>
      <div>Query 1 (filtered): {query1.data?.chatMessages?.length || 0} messages</div>
      <div>Query 2 (all): {query2.data?.chatMessages?.length || 0} messages</div>
      <div>Query 3 (limit): {query3.data?.chatMessages?.length || 0} messages</div>
      
      <h4>All Messages (Query 2):</h4>
      <pre className="text-xs overflow-auto max-h-40">
        {JSON.stringify(query2.data?.chatMessages, null, 2)}
      </pre>
      
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          placeholder="Test message"
        />
        <button
          onClick={createTestMessage}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Create Test Message
        </button>
      </div>
    </div>
  );
}
