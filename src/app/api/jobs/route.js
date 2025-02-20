// src/app/api/jobs/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Job from '@/models/Job';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const city = url.searchParams.get('city');
    const status = url.searchParams.get('status') || 'open';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    await connectToDatabase();
    
    // Build query
    const query = { status };
    if (category) query.category = category;
    if (city) query['location.city'] = city;
    
    // Get jobs with pagination
    const jobs = await Job.find(query)
      .sort({ 'timeline.postedDate': -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'firstName lastName')
      .lean();
    
    const total = await Job.countDocuments(query);
    
    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    await connectToDatabase();
    
    const newJob = new Job({
      ...data,
      customer: session.user.id,
      status: 'open',
      timeline: { postedDate: new Date() }
    });
    
    await newJob.save();
    
    return NextResponse.json(
      { job: newJob, message: 'Job created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}