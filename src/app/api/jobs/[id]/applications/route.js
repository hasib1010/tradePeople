// src/app/api/jobs/[id]/applications/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Job from '@/models/Job';
import Application from '@/models/Application';
import { Tradesperson } from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to apply for jobs' },
        { status: 401 }
      );
    }

    // Verify user is a tradesperson
    if (session.user.role !== 'tradesperson') {
      return NextResponse.json(
        { error: 'Only tradespeople can apply for jobs' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Connect to database
    await connectToDatabase();

    // Validate job ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    // Check if job exists and is open
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'open') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: id,
      tradesperson: session.user.id
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    // Verify user has sufficient credits
    const tradesperson = await Tradesperson.findById(session.user.id);
    if (!tradesperson) {
      return NextResponse.json(
        { error: 'Tradesperson profile not found' },
        { status: 404 }
      );
    }

    // Check if tradesperson is verified by admin
    if (!tradesperson.isVerified) {
      return NextResponse.json(
        { 
          error: 'Your account has not been verified yet. Please wait for admin verification before applying to jobs.',
          verificationRequired: true 
        },
        { status: 403 }
      );
    }

    const creditsAvailable = tradesperson.credits?.available || 0;
    if (creditsAvailable < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits to apply for this job', availableCredits: creditsAvailable },
        { status: 400 }
      );
    }

    // Create application
    const application = new Application({
      job: id,
      tradesperson: session.user.id,
      coverLetter: body.coverLetter,
      bid: {
        type: body.bid.type,
        amount: body.bid.amount,
        currency: body.bid.currency || 'USD',
        estimatedHours: body.bid.estimatedHours,
        estimatedDays: body.bid.estimatedDays
      },
      availability: {
        canStartOn: body.availability.canStartOn,
        availableDays: body.availability.availableDays,
        preferredHours: body.availability.preferredHours
      },
      additionalDetails: body.additionalDetails,
      status: 'pending',
      submittedAt: new Date(),
      lastUpdated: new Date(),
      creditDeducted: true,
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        changedBy: session.user.id,
        note: 'Application submitted'
      }]
    });

    // Start a session for transaction handling
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Save application
      await application.save({ session: dbSession });

      // Create transaction record
      const transaction = new Transaction({
        userId: session.user.id,
        amount: -1,
        type: 'usage',
        description: `Applied for job: ${job.title}`,
        status: 'completed',
        relatedId: application._id,
        relatedType: 'Application',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await transaction.save({ session: dbSession });

      // Update application with transaction reference
      application.creditTransactionId = transaction._id;
      await application.save({ session: dbSession });

      // Deduct credits from tradesperson
      const updatedTradesperson = await Tradesperson.findByIdAndUpdate(
        session.user.id,
        {
          $inc: { 'credits.available': -1, 'credits.spent': 1 },
          $push: {
            'credits.history': {
              amount: -1,
              transactionType: 'usage',
              relatedTo: application._id,
              relatedModel: 'Application',
              date: new Date(),
              notes: `Applied for job: ${job.title}`
            }
          }
        },
        { new: true, session: dbSession }
      );

      if (!updatedTradesperson) {
        throw new Error('Failed to update tradesperson credits');
      }

      // Add application to job's applications array and increment applicationCount
      await Job.findByIdAndUpdate(
        id,
        { 
          $push: { applications: application._id },
          $inc: { applicationCount: 1 }
        },
        { session: dbSession }
      );

      // Commit transaction
      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({
        success: true,
        message: 'Application submitted successfully',
        application: application,
        creditsRemaining: updatedTradesperson.credits.available
      });
    } catch (error) {
      // Abort transaction on error
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// GET function remains unchanged
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to view applications' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Get the job to check ownership
    const job = await Job.findById(id);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the job owner, an admin, or the tradesperson
    const isJobOwner = job.customer && job.customer.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    // Get applications
    const applications = await Application.find({ job: id })
      .populate('tradesperson', 'firstName lastName profileImage businessName skills')
      .sort({ submittedAt: -1 });
    
    // Filter information based on user role
    const filteredApplications = applications.map(app => {
      // Convert to plain object for modification
      const appObj = app.toObject();
      
      // If user is job owner or admin, return full details
      if (isJobOwner || isAdmin) {
        return appObj;
      }
      
      // If user is the tradesperson who submitted the application
      if (app.tradesperson._id.toString() === session.user.id) {
        return appObj;
      }
      
      // For other users, return limited info
      return {
        _id: app._id,
        status: app.status,
        submittedAt: app.submittedAt
      };
    });
    
    return NextResponse.json({
      applications: filteredApplications,
      isJobOwner,
      totalApplications: applications.length
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}