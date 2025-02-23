// src/app/api/admin/jobs/recent/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { User } from "@/models/User";

export async function GET(request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get recent jobs with customer information
    const recentJobs = await Job.find({})
      .sort({ 'timeline.postedDate': -1 })
      .limit(5)
      .populate('customer', 'firstName lastName')
      .select('_id title category status timeline.postedDate customer applicationCount');
      
    // Format the response
    const formattedJobs = await Promise.all(recentJobs.map(async job => {
      return {
        id: job._id.toString(),
        title: job.title,
        category: job.category,
        status: job.status,
        postedDate: job.timeline.postedDate,
        customerName: job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Unknown',
        applicationCount: job.applicationCount || 0
      };
    }));
    
    return NextResponse.json(formattedJobs);
    
  } catch (error) {
    console.error("Error fetching recent jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent jobs" },
      { status: 500 }
    );
  }
}