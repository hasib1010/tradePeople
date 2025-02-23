// src/app/api/conversations/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import Application from '@/models/Application';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// GET handler to fetch all conversations for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Get the latest message and unread count for each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(session.user.id) },
            { recipient: new mongoose.Types.ObjectId(session.user.id) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(session.user.id)] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$recipient", new mongoose.Types.ObjectId(session.user.id)] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);
    
    // Populate user details and application details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id, 'firstName lastName profileImage role');
        
        // If the last message has an application reference, populate it
        let application = null;
        if (conv.lastMessage.application) {
          application = await Application.findById(conv.lastMessage.application)
            .populate('job', 'title status')
            .populate('tradesperson', 'firstName lastName');
        }
        
        return {
          ...conv,
          user: user ? {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
            role: user.role
          } : null,
          application: application || null
        };
      })
    );
    
    return NextResponse.json({ conversations: populatedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// src/app/api/conversations/[userId]/read/route.js
// Mark all messages from a specific user as read
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