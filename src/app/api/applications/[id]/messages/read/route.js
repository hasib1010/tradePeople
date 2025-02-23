// src/app/api/applications/[id]/messages/read/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import Application from '@/models/Application';

export async function POST(request, { params }) {
  try {
    const { id } = params; // application ID
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Verify user has access to this application
    const application = await Application.findById(id)
      .populate('job')
      .populate('tradesperson');
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Check if user is authorized to view messages for this application
    const isCustomer = application.job.customer.toString() === session.user.id;
    const isTradesperson = application.tradesperson._id.toString() === session.user.id;
    
    if (!isCustomer && !isTradesperson) {
      return NextResponse.json({ error: 'Unauthorized to access these messages' }, { status: 403 });
    }
    
    // Mark all messages for this application as read where the user is the recipient
    const result = await Message.updateMany(
      {
        application: id,
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}