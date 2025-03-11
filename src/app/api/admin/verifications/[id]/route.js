// src/app/api/admin/verifications/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import mongoose from "mongoose";
import { VerificationLog } from "@/models/VerificationLog"; // You'll need to create this model
import { sendEmail } from "@/lib/email";

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
      
      // Add verification metadata
      tradesperson.verificationNote = note || "";
      tradesperson.verificationDate = new Date();
      
      // Update certification verification status
      if (approved && tradesperson.certifications && tradesperson.certifications.length > 0) {
        tradesperson.certifications.forEach(cert => {
          if (cert.documentUrl) {
            cert.isVerified = true;
          }
        });
      }
      
      // Update insurance verification if present
      if (approved && tradesperson.insurance && tradesperson.insurance.documentUrl) {
        tradesperson.insurance.isVerified = true;
      }
      
      await tradesperson.save({ session: dbSession });
      
      // Create verification log entry if the model exists
      try {
        const verificationLog = new VerificationLog({
          tradesperson: id,
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
      
      // Send email notification to tradesperson
      try {
        const emailSubject = approved 
          ? "Your Tradesperson Account Has Been Verified"
          : "Important Information About Your Tradesperson Account";
        
        const emailContent = approved
          ? `
            <h1>Your Account Has Been Verified!</h1>
            <p>Hello ${tradesperson.firstName},</p>
            <p>Congratulations! Your tradesperson account has been verified by our team. You can now apply for jobs on our platform.</p>
            ${note ? `<p><strong>Note from our verification team:</strong> ${note}</p>` : ''}
            <p>Log in to your account to start exploring available jobs and submitting applications.</p>
            <p>Thank you for joining our platform!</p>
          `
          : `
            <h1>Your Account Verification Update</h1>
            <p>Hello ${tradesperson.firstName},</p>
            <p>We regret to inform you that your account verification has not been approved at this time.</p>
            ${note ? `<p><strong>Reason:</strong> ${note}</p>` : ''}
            <p>If you believe this is a mistake or would like to provide additional information, please contact our support team.</p>
          `;
        
        await sendEmail({
          to: tradesperson.email,
          subject: emailSubject,
          html: emailContent
        });
      } catch (emailError) {
        console.error("Error sending verification notification:", emailError);
        // Continue even if email fails
      }
      
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