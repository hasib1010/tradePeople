// src/app/api/jobs/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    await connectToDatabase();

    // Find the job by ID with customer and selected tradesperson
    const job = await Job.findById(id)
      .populate("customer", "firstName lastName name email profileImage phoneNumber")
      .populate("selectedTradesperson", "firstName lastName name profileImage");

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Fetch applications separately and add them to the response
    const applications = await Application.find({ job: id })
      .populate("tradesperson", "firstName lastName name email profileImage")
      .sort({ submittedAt: -1 });

    // Convert job to a plain object we can add properties to
    const jobWithApplications = job.toObject();
    
    // Add applications to the job object
    jobWithApplications.applications = applications;
    
    // Make sure applicationCount matches the actual number of applications
    jobWithApplications.applicationCount = applications.length;

    return NextResponse.json(jobWithApplications);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const data = await request.json();
    
    await connectToDatabase();
    
    const job = await Job.findById(id);
    
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }
    
    // Check authorization - only job owner or admin can update
    const isAuthorized = 
      session.user.id === job.customer.toString() || 
      session.user.role === "admin";
      
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to update this job" },
        { status: 403 }
      );
    }
    
    // Update allowed fields
    if (data.status) job.status = data.status;
    if (data.title) job.title = data.title;
    if (data.description) job.description = data.description;
    if (data.category) job.category = data.category;
    if (data.subCategories) job.subCategories = data.subCategories;
    if (data.requiredSkills) job.requiredSkills = data.requiredSkills;
    if (data.budget) {
      if (data.budget.type) job.budget.type = data.budget.type;
      if (data.budget.minAmount) job.budget.minAmount = data.budget.minAmount;
      if (data.budget.maxAmount) job.budget.maxAmount = data.budget.maxAmount;
      if (data.budget.currency) job.budget.currency = data.budget.currency;
    }
    if (data.timeline) {
      if (data.timeline.startDate) job.timeline.startDate = new Date(data.timeline.startDate);
      if (data.timeline.endDate) job.timeline.endDate = new Date(data.timeline.endDate);
      if (data.timeline.expectedDuration) {
        if (data.timeline.expectedDuration.value) 
          job.timeline.expectedDuration.value = data.timeline.expectedDuration.value;
        if (data.timeline.expectedDuration.unit) 
          job.timeline.expectedDuration.unit = data.timeline.expectedDuration.unit;
      }
    }
    if (data.isUrgent !== undefined) job.isUrgent = data.isUrgent;
    if (data.visibility) job.visibility = data.visibility;
    if (data.selectedTradesperson) job.selectedTradesperson = data.selectedTradesperson;
    
    await job.save();
    
    return NextResponse.json(
      { success: true, job, message: "Job updated successfully" }
    );
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    await connectToDatabase();
    
    const job = await Job.findById(id);
    
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }
    
    // Only job owner or admin can delete
    if (session.user.id !== job.customer.toString() && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized to delete this job" },
        { status: 403 }
      );
    }
    
    // Only allow deletion if job is not in-progress
    if (job.status === "in-progress") {
      return NextResponse.json(
        { error: "Cannot delete a job that is in progress" },
        { status: 400 }
      );
    }
    
    await Job.findByIdAndDelete(id);
    
    return NextResponse.json(
      { success: true, message: "Job deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}