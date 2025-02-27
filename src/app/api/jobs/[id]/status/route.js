// src/app/api/jobs/[id]/status/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import mongoose from "mongoose";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const body = await request.json();

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await Job.findById(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    
    // Verify the user is the job owner or admin
    const isJobOwner = job.customer.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";
    
    if (!isJobOwner && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to update this job" }, { status: 403 });
    }

    // Validate status change
    if (body.status && !["open", "in-progress", "completed", "canceled", "expired"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid job status" }, { status: 400 });
    }

    // Additional validation for specific status changes
    if (body.status === "in-progress") {
      // Ensure a tradesperson is selected
      if (!body.selectedTradesperson) {
        return NextResponse.json({ error: "A tradesperson must be selected to mark job as in-progress" }, { status: 400 });
      }
      
      if (!mongoose.Types.ObjectId.isValid(body.selectedTradesperson)) {
        return NextResponse.json({ error: "Invalid tradesperson ID" }, { status: 400 });
      }
      
      job.selectedTradesperson = body.selectedTradesperson;
    }

    // Update job status
    job.status = body.status;

    // Add additional details for status changes
    if (body.status === "in-progress") {
      // Set job start date
      if (!job.timeline) job.timeline = {};
      job.timeline.startDate = new Date();
    }

    await job.save();

    return NextResponse.json({
      success: true,
      message: `Job status updated to ${body.status}`,
      job
    });

  } catch (error) {
    console.error("Error updating job status:", error);
    return NextResponse.json({ error: error.message || "Failed to update job status" }, { status: 500 });
  }
}