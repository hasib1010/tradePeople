// src/app/api/jobs/[id]/applications/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { Tradesperson } from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "You must be logged in to apply for jobs" }, { status: 401 });
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ error: "Only tradespeople can apply for jobs" }, { status: 403 });
    }

    const { id } = await params; // Await params
    const body = await request.json();

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid job ID format" }, { status: 400 });
    }

    const job = await Job.findById(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.status !== "open") {
      return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 });
    }

    const existingApplication = await Application.findOne({ job: id, tradesperson: session.user.id });
    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied for this job" }, { status: 400 });
    }

    const tradesperson = await Tradesperson.findById(session.user.id);
    if (!tradesperson) return NextResponse.json({ error: "Tradesperson profile not found" }, { status: 404 });
    if (!tradesperson.isVerified) {
      return NextResponse.json(
        { error: "Your account has not been verified yet. Please wait for admin verification.", verificationRequired: true },
        { status: 403 }
      );
    }

    const creditCost = job.creditCost || 1;
    const creditsAvailable = tradesperson.credits?.available || 0;
    if (creditsAvailable < creditCost) {
      return NextResponse.json(
        { error: `Insufficient credits (need ${creditCost})`, availableCredits: creditsAvailable },
        { status: 400 }
      );
    }

    const application = new Application({
      job: id,
      tradesperson: session.user.id,
      coverLetter: body.coverLetter,
      bid: {
        type: body.bid.type,
        amount: body.bid.amount,
        currency: body.bid.currency || "USD",
        estimatedHours: body.bid.estimatedHours,
        estimatedDays: body.bid.estimatedDays,
      },
      availability: {
        canStartOn: body.availability.canStartOn,
        availableDays: body.availability.availableDays,
        preferredHours: body.availability.preferredHours,
      },
      additionalDetails: body.additionalDetails,
      status: "pending",
      submittedAt: new Date(),
      lastUpdated: new Date(),
      creditDeducted: true,
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: session.user.id, note: "Application submitted" }],
    });

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      await application.save({ session: dbSession });

      const transaction = new Transaction({
        userId: session.user.id,
        amount: -creditCost,
        type: "usage",
        description: `Applied for job: ${job.title}`,
        status: "completed",
        relatedId: application._id,
        relatedType: "Application",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await transaction.save({ session: dbSession });
      application.creditTransactionId = transaction._id;
      await application.save({ session: dbSession });

      const updatedTradesperson = await Tradesperson.findByIdAndUpdate(
        session.user.id,
        {
          $inc: { "credits.available": -creditCost, "credits.spent": creditCost },
          $push: {
            "credits.history": {
              amount: -creditCost,
              transactionType: "usage",
              relatedTo: application._id,
              relatedModel: "Application",
              date: new Date(),
              notes: `Applied for job: ${job.title}`,
            },
          },
        },
        { new: true, session: dbSession }
      );

      if (!updatedTradesperson) throw new Error("Failed to update tradesperson credits");

      await Job.findByIdAndUpdate(
        id,
        { $push: { applications: application._id }, $inc: { applicationCount: 1 } },
        { session: dbSession }
      );

      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({
        success: true,
        message: "Application submitted successfully",
        application,
        creditsRemaining: updatedTradesperson.credits.available,
      });
    } catch (error) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "You must be logged in to view applications" }, { status: 401 });

    await connectToDatabase();

    const { id } = await params; // Await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid job ID format" }, { status: 400 });
    }

    const job = await Job.findById(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const isJobOwner = job.customer && job.customer.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";

    const applications = await Application.find({ job: id })
      .populate("tradesperson", "firstName lastName profileImage businessName skills")
      .sort({ submittedAt: -1 });

    const filteredApplications = applications.map((app) => {
      const appObj = app.toObject();
      if (isJobOwner || isAdmin) return appObj;
      if (app.tradesperson._id.toString() === session.user.id) return appObj;
      return { _id: app._id, status: app.status, submittedAt: app.submittedAt };
    });

    return NextResponse.json({
      applications: filteredApplications,
      isJobOwner,
      totalApplications: applications.length,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch applications" }, { status: 500 });
  }
}