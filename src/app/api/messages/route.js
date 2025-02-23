// src/app/api/messages/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import Application from '@/models/Application';
import { User } from '@/models/User';

// GET handler to fetch messages
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('applicationId');
    const userId = searchParams.get('userId');
    
    // Define query based on available parameters
    let query = {};
    
    if (applicationId) {
      // Fetch application to verify user has access
      const application = await Application.findById(applicationId)
        .populate('job')
        .populate('tradesperson');
      
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      
      // Check if user is authorized to view these messages
      const isCustomer = application.job.customer.toString() === session.user.id;
      const isTradesperson = application.tradesperson._id.toString() === session.user.id;
      
      if (!isCustomer && !isTradesperson) {
        return NextResponse.json({ error: 'Unauthorized to view these messages' }, { status: 403 });
      }
      
      query.application = applicationId;
    } else if (userId) {
      // Fetch conversations between current user and specified user
      query = {
        $or: [
          { sender: session.user.id, recipient: userId },
          { sender: userId, recipient: session.user.id }
        ]
      };
    } else {
      // Fetch all conversations for current user
      query = {
        $or: [
          { sender: session.user.id },
          { recipient: session.user.id }
        ]
      };
    }
    
    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName profileImage role')
      .populate('recipient', 'firstName lastName profileImage role');
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST handler to create a message
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Parse request body
    const { applicationId, recipientId, content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    
    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }
    
    // If applicationId is provided, check if user has access
    if (applicationId) {
      const application = await Application.findById(applicationId)
        .populate('job')
        .populate('tradesperson');
      
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      
      // Check if user is authorized to send messages for this application
      const isCustomer = application.job.customer.toString() === session.user.id;
      const isTradesperson = application.tradesperson._id.toString() === session.user.id;
      
      if (!isCustomer && !isTradesperson) {
        return NextResponse.json({ error: 'Unauthorized to send messages for this application' }, { status: 403 });
      }
      
      // Verify recipient is related to this application
      const isRecipientInvolved = 
        recipient._id.toString() === application.tradesperson._id.toString() ||
        recipient._id.toString() === application.job.customer.toString();
        
      if (!isRecipientInvolved) {
        return NextResponse.json({ error: 'Recipient is not involved in this application' }, { status: 400 });
      }
    }
    
    // Create the message
    const message = new Message({
      sender: session.user.id,
      recipient: recipientId,
      content,
      application: applicationId || null,
      read: false
    });
    
    await message.save();
    
    // Populate sender and recipient for the response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName profileImage role')
      .populate('recipient', 'firstName lastName profileImage role');
    
    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Parse request body
    const { conversationId, userId } = await request.json();
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Mark messages as read for the specific conversation
    await Message.updateMany(
      {
        $or: [
          { sender: conversationId, recipient: session.user.id },
          { sender: session.user.id, recipient: conversationId }
        ],
        read: false
      },
      { $set: { read: true } }
    );

    return NextResponse.json({ 
      message: 'Messages marked as read',
      success: true 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}