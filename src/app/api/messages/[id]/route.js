// src/app/api/messages/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view messages" },
        { status: 401 }
      );
    }

    const { id } = params;
    
    await connectToDatabase();
    
    // Get the conversation
    const conversation = await Conversation.findById(id)
      .populate('participants', 'firstName lastName profileImage')
      .populate('job', 'title status');
    
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    // Check if user is a participant
    if (!conversation.participants.some(p => p._id.toString() === session.user.id)) {
      return NextResponse.json(
        { error: "You don't have permission to view this conversation" },
        { status: 403 }
      );
    }
    
    // Mark as read
    await conversation.markAsReadBy(session.user.id);
    
    // Get messages for this conversation
    // Assuming you have a Message model
    // If not, you would need to create it
    let messages = [];
    
    // Check if Message model exists
    if (mongoose.models.Message) {
      messages = await Message.find({ conversation: id })
        .sort({ createdAt: 1 })
        .populate('sender', 'firstName lastName profileImage');
    } else {
      // If Message model doesn't exist yet, return empty array
      console.log("Message model not found. Returning empty messages array.");
    }
    
    return NextResponse.json({
      conversation,
      messages
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to send messages" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Get the conversation
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    // Check if user is a participant
    if (!conversation.participants.includes(session.user.id)) {
      return NextResponse.json(
        { error: "You don't have permission to send messages in this conversation" },
        { status: 403 }
      );
    }
    
    // Create the message
    let message;
    
    // Check if Message model exists
    if (mongoose.models.Message) {
      message = new Message({
        conversation: id,
        sender: session.user.id,
        content,
        readBy: [session.user.id]
      });
      
      await message.save();
    } else {
      // If Message model doesn't exist yet, just update conversation's lastMessage
      console.log("Message model not found. Only updating conversation's lastMessage field.");
    }
    
    // Update the conversation's last message
    conversation.lastMessage = {
      content,
      sender: session.user.id,
      sentAt: new Date()
    };
    
    // Mark as read by the sender
    await conversation.markAsReadBy(session.user.id);
    
    await conversation.save();
    
    return NextResponse.json({
      success: true,
      message: message || { 
        content, 
        sender: session.user.id, 
        createdAt: new Date() 
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}