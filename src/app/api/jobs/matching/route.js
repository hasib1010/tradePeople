// src/app/api/jobs/matching/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { Tradesperson } from "@/models/User";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view matching jobs" },
        { status: 401 }
      );
    }

    if (session.user.role !== 'tradesperson') {
      return NextResponse.json(
        { error: "Only tradespeople can view matching jobs" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Get tradesperson skills
    const tradesperson = await Tradesperson.findById(session.user.id).select('skills');
    
    if (!tradesperson) {
      return NextResponse.json(
        { error: "Tradesperson profile not found" },
        { status: 404 }
      );
    }
    
    const skills = tradesperson.skills || [];
    
    // Count matching jobs (open jobs with matching skills or no specific skills required)
    const count = await Job.countDocuments({
      status: 'open',
      $or: [
        { requiredSkills: { $in: skills } },
        { requiredSkills: { $size: 0 } },
        { requiredSkills: { $exists: false } }
      ]
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting matching jobs:", error);
    return NextResponse.json(
      { error: "Failed to count matching jobs", count: 0 },
      { status: 500 }
    );
  }
}