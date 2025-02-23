// src/app/api/applications/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view applications" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    await connectToDatabase();
    
    let applications = [];
    
    if (session.user.role === 'tradesperson') {
      // Get applications submitted by this tradesperson
      const query = { tradesperson: session.user.id };
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        query.status = status;
      }
      
      applications = await Application.find(query)
        .sort({ submittedAt: -1 })
        .populate({
          path: 'job',
          select: 'title category budget location status timeline',
          populate: {
            path: 'customer',
            select: 'firstName lastName profileImage'
          }
        });
    } 
    else if (session.user.role === 'customer') {
      // For customers, first get their jobs
      const jobs = await Job.find({ customer: session.user.id });
      const jobIds = jobs.map(job => job._id);
      
      // Then get applications for those jobs
      const query = { job: { $in: jobIds } };
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        query.status = status;
      }
      
      applications = await Application.find(query)
        .sort({ submittedAt: -1 })
        .populate('tradesperson', 'firstName lastName profileImage')
        .populate('job', 'title category status');
    }
    else if (session.user.role === 'admin') {
      // Admins can see all applications
      const query = {};
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        query.status = status;
      }
      
      applications = await Application.find(query)
        .sort({ submittedAt: -1 })
        .populate('tradesperson', 'firstName lastName profileImage')
        .populate({
          path: 'job',
          select: 'title category status',
          populate: {
            path: 'customer',
            select: 'firstName lastName'
          }
        });
    }
    
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}