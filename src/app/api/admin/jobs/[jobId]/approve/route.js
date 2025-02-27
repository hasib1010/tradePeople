import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;
    const { creditCost } = await request.json();

    if (!creditCost || creditCost < 1) {
      return NextResponse.json(
        { error: "Invalid credit cost" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const job = await Job.findById(jobId);
    
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "draft") {
      return NextResponse.json(
        { error: "Job cannot be approved in current status" },
        { status: 400 }
      );
    }

    job.status = "open";
    job.creditCost = creditCost;
    await job.save();

    return NextResponse.json(
      { success: true, message: "Job approved successfully", job },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving job:", error);
    return NextResponse.json(
      { error: "Failed to approve job" },
      { status: 500 }
    );
  }
}