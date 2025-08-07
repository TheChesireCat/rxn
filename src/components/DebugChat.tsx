'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/instant';

interface DebugChatProps {
  roomId: string;
  currentUserId: string;
}

export function DebugChat({ roomId, currentUserId }: DebugChatProps) {
  const [testText, setTestText] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  // Try multiple query approaches
  const query1 = db.useQuery({
    chatMessages: {
      $: {
        where: { roomId },
        order: { createdAt: 'asc' }
      }
    }
  });

  const query2 = db.useQuery({
    chatMessages: {}
  });

  const query3 = db.useQuery({
    rooms: {
      $: { where: { id: roomId } },
      messages: {}
    }
  });

  // Log query results
  useEffect(() => {
    const log = `
Query Results:
1. Filtered by roomId: ${query1.data?.chatMessages?.length || 0} messages
2. All messages: ${query2.data?.chatMessages?.length || 0} messages  
3. Via room relation: ${query3.data?.rooms?.[0]?.messages?.length || 0} messages
Room exists: ${!!query3.data?.rooms?.[0]}
    `.trim();
    console.log('[DebugChat]', log);
  }, [query1.data, query2.data, query3.data]);

  // Test direct database write
  const testDirectWrite = async () => {
    const messageId = crypto.randomUUID();
    const text = testText || `Test ${Date.now()}`;
    
    try {
      addLog(`Creating message: ${text}`);
      
      await db.transact(
        db.tx.chatMessages[messageId].update({
          roomId,
          userId: currentUserId,
          text,
          createdAt: Date.now(),
        })
      );
      
      addLog(`✅ Message created with ID: ${messageId.slice(0, 8)}...`);
      setTestText('');
      
      // Verify it was created
      setTimeout(() => {
        const found = query1.data?.chatMessages?.find((m: any) => m.id === messageId);
        if (found) {
          addLog(`✅ Message verified in query1`);
        } else {
          addLog(`❌ Message not found in query1 after creation`);
        }
      }, 1000);
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      console.error('[DebugChat] Direct write error:', error);
    }
  };

  // Test API write
  const testAPIWrite = async () => {
    const text = testText || `API Test ${Date.now()}`;
    
    try {
      addLog(`Sending via API: ${text}`);
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId: currentUserId,
          text
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addLog(`✅ API response: ${result.messageId?.slice(0, 8)}...`);
        setTestText('');
      } else {
        addLog(`❌ API error: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Network error: ${error.message}`);
      console.error('[DebugChat] API error:', error);
    }
  };

  // Display all messages from query2 (unfiltered)
  const allMessages = query2.data?.chatMessages || [];
  const roomMessages = allMessages.filter((m: any) => m.roomId === roomId);
  const otherMessages = allMessages.filter((m: any) => m.roomId !== roomId);

  return (
    <div className="fixed top-20 left-4 z-50 w-96 max-h-[600px] overflow-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
        🔍 Chat Debug Panel
      </h3>
      
      {/* Status */}
      <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
        <div>Room ID: {roomId.slice(0, 8)}...</div>
        <div>User ID: {currentUserId.slice(0, 8)}...</div>
        <div className="mt-1">
          <div className={query1.isLoading ? 'text-yellow-600' : 'text-green-600'}>
            Query1 (filtered): {query1.data?.chatMessages?.length || 0} msgs
            {query1.isLoading && ' (loading...)'}
          </div>
          <div className={query2.isLoading ? 'text-yellow-600' : 'text-green-600'}>
            Query2 (all): {query2.data?.chatMessages?.length || 0} msgs
            {query2.isLoading && ' (loading...)'}
          </div>
          <div className={query3.isLoading ? 'text-yellow-600' : 'text-green-600'}>
            Query3 (relation): {query3.data?.rooms?.[0]?.messages?.length || 0} msgs
            {query3.isLoading && ' (loading...)'}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-3 space-y-2">
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Test message text..."
          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
        />
        <div className="flex gap-2">
          <button
            onClick={testDirectWrite}
            className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Direct DB Write
          </button>
          <button
            onClick={testAPIWrite}
            className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test API Write
          </button>
        </div>
      </div>

      {/* Message Analysis */}
      <div className="mb-3 space-y-2">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Message Analysis:
        </div>
        <div className="text-xs space-y-1">
          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
            ✅ This room: {roomMessages.length} messages
          </div>
          <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
            ⚠️ Other rooms: {otherMessages.length} messages
          </div>
        </div>
      </div>

      {/* Messages List */}
      {roomMessages.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Messages in this room:
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {roomMessages.slice(0, 5).map((msg: any) => (
              <div key={msg.id} className="text-xs p-1 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-mono text-gray-500">{msg.id.slice(0, 8)}...</div>
                <div className="truncate">{msg.text}</div>
                <div className="text-gray-400">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div>
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Activity Log:
        </div>
        <div className="max-h-24 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded p-1">
          {logs.length === 0 ? (
            <div className="text-xs text-gray-400">No activity yet...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          const el = document.querySelector('[data-debug-chat]');
          if (el) el.remove();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        data-debug-chat
      >
        ✕
      </button>
    </div>
  );
}
