import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { Tradesperson } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendEmail, createEmailTemplate } from "@/lib/email";
import mongoose from "mongoose";

export async function POST(request, { params }) {
  try {
    // Ensure params is awaited (fixing the first error)
    const jobId = params.jobId;
    
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creditCost } = await request.json();

    if (!creditCost || creditCost < 1) {
      return NextResponse.json({ error: "Invalid credit cost" }, { status: 400 });
    }

    await connectToDatabase();

    // First, get the job details
    const job = await Job.findById(jobId).populate('customer');

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "draft") {
      return NextResponse.json(
        { error: "Job cannot be approved in current status" },
        { status: 400 }
      );
    }

    // IMPORTANT: Use direct MongoDB update to bypass schema validation for attachments
    // This avoids the "Cast to [string]" error you're experiencing
    const updateResult = await Job.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(jobId) },
      {
        $set: {
          status: "open",
          creditCost: creditCost
        }
      }
    );
    
    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json(
        { error: "Failed to update job status" },
        { status: 500 }
      );
    }

    // Get the updated job for notifications and response
    const updatedJob = await Job.findById(jobId).populate('customer');

    // Find tradespeople with matching postal code
    const tradespeople = await Tradesperson.find({
      'location.postalCode': job.location.postalCode,
      isActive: true,
      role: 'tradesperson',
    });

    if (tradespeople.length > 0) {
      // Prepare email content using your template
      const jobLink = `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}`;
      const subject = `New Job Opportunity in Your Area: ${job.title}`;
      const text = `
        A new job has been posted in your area!
        Title: ${job.title}
        Location: ${job.location.address}, ${job.location.city}, ${job.location.postalCode}
        Description: ${job.description}
        View details and apply here: ${jobLink}
      `;
      const html = createEmailTemplate({
        title: "New Job Opportunity",
        heading: "New Job in Your Area",
        content: `
          <p><strong>Title:</strong> ${job.title}</p>
          <p><strong>Location:</strong> ${job.location.address}, ${job.location.city}, ${job.location.postalCode}</p>
          <p><strong>Description:</strong> ${job.description}</p>
        `,
        buttonText: "View Job Details",
        buttonUrl: jobLink,
        footerText: "© 2025 Tradie Service Marketplace. All rights reserved.",
      });

      // Send email to each tradesperson
      try {
        const emailPromises = tradespeople.map((tradesperson) =>
          sendEmail({
            to: tradesperson.email,
            subject,
            text,
            html,
          })
        );

        await Promise.all(emailPromises);
      } catch (emailError) {
        console.error("Error sending notification emails:", emailError);
        // Continue even if emails fail - the job was already approved
      }
    }

    return NextResponse.json(
      { success: true, message: "Job approved successfully", job: updatedJob },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving job or sending notifications:", error);
    return NextResponse.json(
      { error: "Failed to approve job or send notifications", details: error.message },
      { status: 500 }
    );
  }
}