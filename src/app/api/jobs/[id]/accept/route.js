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
    if (!session || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Await params
    const { applicationId } = await request.json();

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const job = await Job.findById(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.customer._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not your job" }, { status: 403 });
    }
    if (job.status !== "open") {
      return NextResponse.json({ error: "Job must be open to accept an application" }, { status: 400 });
    }

    const application = await Application.findById(applicationId);
    if (!application || application.job.toString() !== id) {
      return NextResponse.json({ error: "Invalid application" }, { status: 400 });
    }

    job.status = "in-progress";
    job.selectedTradesperson = application.tradesperson;
    await job.save();

    application.status = "accepted";
    await application.save();

    await Application.updateMany(
      { job: id, _id: { $ne: applicationId }, status: "pending" },
      { status: "rejected" }
    );

    return NextResponse.json({
      success: true,
      message: "Application accepted, job now in progress",
      job,
    });
  } catch (error) {
    console.error("Error accepting application:", error);
    return NextResponse.json({ error: "Failed to accept application" }, { status: 500 });
  }
}