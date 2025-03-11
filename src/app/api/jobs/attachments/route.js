import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    // 1. Get authentication session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const { jobId, attachments } = await request.json();
    
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }
    
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return NextResponse.json({ error: "No attachment data provided" }, { status: 400 });
    }

    // 3. Connect to database
    await connectToDatabase();
    
    // 4. Check if job exists and belongs to the current user
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership or admin rights
    if (job.customer.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ 
        error: "You don't have permission to update this job" 
      }, { status: 403 });
    }

    // 5. Update the job with attachment information
    try {
      // Use direct MongoDB update to bypass Mongoose validation if needed
      const result = await Job.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(jobId) },
        { $push: { attachments: { $each: attachments } } }
      );
      
      console.log(`Updated job ${jobId} with ${attachments.length} attachments`, result);
      
      if (result.modifiedCount === 0) {
        return NextResponse.json({ 
          error: "Failed to update job with attachments" 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Added ${attachments.length} attachments to job`,
        count: attachments.length
      });
    } catch (dbError) {
      console.error("Database error when updating job:", dbError);
      return NextResponse.json({ 
        error: "Database error when updating job",
        details: dbError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in job attachments endpoint:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error.message 
    }, { status: 500 });
  }
}