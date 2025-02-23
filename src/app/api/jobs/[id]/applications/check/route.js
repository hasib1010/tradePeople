// src/app/api/jobs/[id]/applications/check/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Application from '@/models/Application';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to check application status' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Connect to database
    await connectToDatabase();

    // Check if user has already applied
    // Using correct field names: job and tradesperson (as defined in your model)
    const existingApplication = await Application.findOne({
      job: id,
      tradesperson: session.user.id
    });

    console.log('Application check for user:', session.user.id, 'job:', id, 'result:', !!existingApplication);

    return NextResponse.json({
      hasApplied: !!existingApplication,
      applicationStatus: existingApplication ? existingApplication.status : null,
      applicationId: existingApplication ? existingApplication._id : null
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while checking application status' },
      { status: 500 }
    );
  }
}