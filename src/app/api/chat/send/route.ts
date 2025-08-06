import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, text } = body;

    // Validate required fields
    if (!roomId || !userId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, userId, text' },
        { status: 400 }
      );
    }

    // Validate text length and content
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message text must be a non-empty string' },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: 'Message text must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Sanitize the message text
    const sanitizedText = text.trim();

    // Create the chat message
    const messageId = crypto.randomUUID();
    await db.transact(
      db.tx.chatMessages[messageId].update({
        roomId,
        userId,
        text: sanitizedText,
        createdAt: Date.now(),
      }).link({ room: roomId })
    );

    return NextResponse.json({ 
      success: true, 
      messageId,
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}