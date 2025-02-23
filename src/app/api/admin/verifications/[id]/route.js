// src/app/api/admin/verifications/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import mongoose from "mongoose";
import { VerificationLog } from "@/models/VerificationLog"; // You'll need to create this model

export async function GET(request, { params }) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the tradesperson
    const tradesperson = await Tradesperson.findById(id);
    
    if (!tradesperson) {
      return NextResponse.json({ error: "Tradesperson not found" }, { status: 404 });
    }
    
    return NextResponse.json(tradesperson);
    
  } catch (error) {
    console.error("Error fetching tradesperson details:", error);
    return NextResponse.json(
      { error: "Failed to fetch tradesperson details" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { approved, note } = body;
    
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: "Approval status must be specified" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the tradesperson
    const tradesperson = await Tradesperson.findById(id);
    
    if (!tradesperson) {
      return NextResponse.json({ error: "Tradesperson not found" }, { status: 404 });
    }
    
    // Start a session for transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    
    try {
      // Update tradesperson verification status
      tradesperson.isVerified = approved;
      
      // If rejected, set isActive to false
      if (!approved) {
        tradesperson.isActive = false;
      }
      
      await tradesperson.save({ session: dbSession });
      
      // Create verification log entry if the model exists
      try {
        const verificationLog = new VerificationLog({
          tradespeople: id,
          admin: session.user.id,
          action: approved ? 'approved' : 'rejected',
          note: note || '',
          timestamp: new Date()
        });
        
        await verificationLog.save({ session: dbSession });
      } catch (logError) {
        // If VerificationLog model doesn't exist, just log the error but continue
        console.warn("Could not save verification log:", logError);
      }
      
      // Commit the transaction
      await dbSession.commitTransaction();
      dbSession.endSession();
      
      return NextResponse.json({
        success: true,
        message: `Tradesperson ${approved ? 'approved' : 'rejected'} successfully`
      });
      
    } catch (error) {
      // Abort transaction on error
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error("Error updating tradesperson verification:", error);
    return NextResponse.json(
      { error: "Failed to update tradesperson verification" },
      { status: 500 }
    );
  }
}
  