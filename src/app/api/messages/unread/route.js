// src/app/api/messages/unread/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Message from '@/models/Message';

// Prevent this endpoint from being cached by setting dynamic = true
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Count unread messages for the current user
    const count = await Message.countDocuments({
      recipient: session.user.id,
      read: false
    });
    
    // Return the count with cache control headers to prevent caching
    return new NextResponse(
      JSON.stringify({ count }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread message count', count: 0 }, { status: 500 });
  }
}