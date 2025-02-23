// src/app/api/jobs/customer/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "customer" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectToDatabase();

    // Get all jobs for the current customer
    const jobs = await Job.find({ 
      customer: session.user.id 
    })
    .sort({ "timeline.postedDate": -1 })
    .lean();

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching customer jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer jobs" },
      { status: 500 }
    );
  }
}