// src/app/api/admin/jobs/[jobId]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import TradeCategory from "@/models/TradeCategory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Get the job without trying to populate the category field
    const job = await Job.findById(jobId)
      .populate("customer", "firstName lastName email profileImage")
      .populate("selectedTradesperson", "firstName lastName email profileImage")
      .lean();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Add category name to the job
    if (job.category) {
      if (typeof job.category === 'string') {
        // If it's a string that looks like an ObjectId, try to fetch the category
        if (mongoose.Types.ObjectId.isValid(job.category)) {
          try {
            const category = await TradeCategory.findById(job.category).lean();
            if (category) {
              // Keep original category ID but add name
              job.categoryName = category.name;
            }
          } catch (error) {
            console.error("Error fetching category:", error);
          }
        } else {
          // If it's just a string (old format), use it as the name
          job.categoryName = job.category;
        }
      }
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}