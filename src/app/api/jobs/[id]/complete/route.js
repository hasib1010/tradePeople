// src/app/api/jobs/[id]/complete/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import mongoose from "mongoose";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "customer") {
      return NextResponse.json({ error: "Only customers can complete jobs" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await Job.findById(id).populate("customer selectedTradesperson");
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.customer._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "You don't own this job" }, { status: 403 });
    }
    if (job.status !== "in-progress") {
      return NextResponse.json({ error: "Job must be in-progress to complete" }, { status: 400 });
    }
    if (!job.selectedTradesperson) {
      return NextResponse.json({ error: "No tradesperson selected" }, { status: 400 });
    }

    // Update job status and add completion details
    job.status = "completed";
    job.completionDetails = {
      completedAt: new Date(),
      finalAmount: body.finalAmount || job.budget.minAmount || 0,
      customerFeedback: body.customerFeedback || "",
      tradespersonFeedback: "",
      dispute: { exists: false },
    };
    
    // Find the accepted application for this job
    const acceptedApplication = await Application.findOne({ 
      job: id, 
      tradesperson: job.selectedTradesperson._id,
      status: "accepted" 
    });

    if (!acceptedApplication) {
      return NextResponse.json({ error: "No accepted application found" }, { status: 400 });
    }

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      await job.save({ session: dbSession });

      // Optionally: Update application with completion details if needed
      // acceptedApplication.completionDetails = {...};
      // await acceptedApplication.save({ session: dbSession });
      
      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({
        success: true,
        message: "Job marked as completed successfully",
        job,
        reviewEligible: true,
        tradespersonId: job.selectedTradesperson._id,
      });
    } catch (error) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error completing job:", error);
    return NextResponse.json({ error: error.message || "Failed to complete job" }, { status: 500 });
  }
}