// src/app/api/jobs/tradesperson/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'tradesperson') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get all jobs where this tradesperson is selected and status is either in-progress or completed
    const jobs = await Job.find({
      selectedTradesperson: session.user.id,
      status: { $in: ['in-progress', 'completed'] }
    })
    .populate('customer', 'firstName lastName email profileImage')
    .sort({ 'timeline.startDate': -1 })
    .lean();
    
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching tradesperson jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}