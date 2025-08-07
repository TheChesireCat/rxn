import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';

/**
 * Background cleanup endpoint for old emoji reactions
 * Removes reactions older than 30 seconds to prevent database bloat
 */
export async function DELETE(request: NextRequest) {
  try {
    const cutoffTime = Date.now() - 30000; // 30 seconds ago
    
    // Query old reactions
    const { data } = await adminDb.query({
      reactions: {
        $: {
          where: {
            createdAt: { $lt: cutoffTime }
          }
        }
      }
    });

    if (data?.reactions && data.reactions.length > 0) {
      // Delete old reactions
      const deleteTransactions = data.reactions.map(reaction =>
        adminDb.tx.reactions[reaction.id].delete()
      );

      await adminDb.transact(deleteTransactions);
      
      console.log(`Cleaned up ${data.reactions.length} old reactions`);
      
      return NextResponse.json({
        success: true,
        cleaned: data.reactions.length,
        message: `Cleaned up ${data.reactions.length} old reactions`
      });
    }

    return NextResponse.json({
      success: true,
      cleaned: 0,
      message: 'No old reactions to clean up'
    });

  } catch (error) {
    console.error('Failed to cleanup reactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup reactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'reactions-cleanup',
    status: 'active',
    description: 'Cleans up reactions older than 30 seconds'
  });
}
