// src/app/api/conversations/[userId]/read/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Mark all unread messages from this user as read
    const result = await Message.updateMany(
      {
        sender: userId,
        recipient: session.user.id,
        read: false
      },
      {
        $set: { 
          read: true,
          readAt: new Date()
        }
      }
    );
    
    // For debugging
    console.log(`Marked ${result.modifiedCount} messages as read from user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ 
      error: 'Failed to mark messages as read' 
    }, { status: 500 });
  }
}