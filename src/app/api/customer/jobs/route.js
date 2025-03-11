import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Allow access only for customers and admins
    if (session.user.role !== "customer" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build query object
    const query = { customer: userId || session.user.id };
    
    // Add status filter if provided
    if (status && status !== "all") {
      query.status = status;
    }
    
    // Fetch jobs with pagination
    const jobs = await Job.find(query)
      .populate({
        path: "category",
        select: "name"
      })
      .populate({
        path: "applications",
        select: "_id tradesperson status submittedAt"
      })
      .sort({ "timeline.postedDate": -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total jobs for pagination
    const total = await Job.countDocuments(query);

    // Debug log to verify attachments
    console.log(`Fetched ${jobs.length} jobs for customer ${userId || session.user.id}`);
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1} (${job._id}): ${job.attachments?.length || 0} attachments`);
    });
    
    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching customer jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}