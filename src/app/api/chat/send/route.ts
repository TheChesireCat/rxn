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

    // Verify room exists first
    const roomQuery = await db.query({
      rooms: { $: { where: { id: roomId } } }
    });
    
    if (!roomQuery.rooms || roomQuery.rooms.length === 0) {
      console.error('Room not found:', roomId);
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Create the chat message with proper room link
    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    
    console.log('Creating chat message:', {
      messageId,
      roomId,
      userId,
      text: sanitizedText.substring(0, 50),
      timestamp
    });
    
    try {
      await db.transact(
        db.tx.chatMessages[messageId].update({
          roomId,
          userId,
          text: sanitizedText,
          createdAt: timestamp,
        }).link({ room: roomId })
      );
      
      console.log('Message created successfully:', messageId);
      
      // Verify message was created
      const verifyQuery = await db.query({
        chatMessages: { $: { where: { id: messageId } } }
      });
      
      if (verifyQuery.chatMessages && verifyQuery.chatMessages.length > 0) {
        console.log('Message verified in database');
      } else {
        console.warn('Message created but not found in verification query');
      }
      
    } catch (txError) {
      console.error('Transaction error:', txError);
      throw txError;
    }

    return NextResponse.json({ 
      success: true, 
      messageId,
      timestamp,
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