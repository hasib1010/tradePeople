// src/app/api/applications/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    await connectToDatabase();

    // Find the application by ID with populated references
    const application = await Application.findById(id)
      .populate("job")
      .populate("tradesperson", "firstName lastName email profileImage phoneNumber")
      .populate({
        path: "job",
        populate: {
          path: "customer",
          select: "firstName lastName email profileImage phoneNumber"
        }
      });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check authorization - only the job owner, applicant, or admin can view details
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view application details" },
        { status: 401 }
      );
    }

    const isJobOwner = session.user.id === application.job.customer._id.toString();
    const isApplicant = session.user.id === application.tradesperson._id.toString();
    const isAdmin = session.user.role === "admin";

    if (!isJobOwner && !isApplicant && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view this application" },
        { status: 403 }
      );
    }

    // Mark as viewed by customer if applicable
    if (isJobOwner && !application.customerViewed) {
      application.customerViewed = true;
      await application.save();
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to update an application" },
        { status: 401 }
      );
    }

    const id = params.id;
    const data = await request.json();
    
    await connectToDatabase();
    
    const application = await Application.findById(id)
      .populate("job")
      .populate("tradesperson");
    
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    // Check authorization - only job owner can update status, applicant can withdraw
    const isJobOwner = session.user.id === application.job.customer.toString();
    const isApplicant = session.user.id === application.tradesperson._id.toString();
    const isAdmin = session.user.role === "admin";
    
    if (!isJobOwner && !isApplicant && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to update this application" },
        { status: 403 }
      );
    }
    
    // Job owner can update status (shortlist, accept, reject)
    if (isJobOwner || isAdmin) {
      if (data.status) {
        application.status = data.status;
      }
      
      if (data.notes?.customer) {
        application.notes = {
          ...application.notes,
          customer: data.notes.customer
        };
      }
    }
    
    // Applicant can withdraw or update notes
    if (isApplicant) {
      if (data.status === 'withdrawn') {
        application.status = 'withdrawn';
        if (data.withdrawalReason) {
          application.withdrawalReason = data.withdrawalReason;
        }
      }
      
      if (data.notes?.tradesperson) {
        application.notes = {
          ...application.notes,
          tradesperson: data.notes.tradesperson
        };
      }
    }
    
    // Admin can do anything including adding internal notes
    if (isAdmin && data.notes?.internal) {
      application.notes = {
        ...application.notes,
        internal: data.notes.internal
      };
    }
    
    application.lastUpdated = new Date();
    await application.save();
    
    return NextResponse.json({
      success: true,
      application,
      message: "Application updated successfully"
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}