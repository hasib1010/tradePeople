// src/app/api/applications/stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view application statistics" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    let statsQuery = {};
    
    if (session.user.role === 'tradesperson') {
      // For tradespeople, count their own applications
      statsQuery = { tradesperson: session.user.id };
    } else if (session.user.role === 'customer') {
      // For customers, we'd need to get their jobs first and then count applications
      // This is just a stub - you would implement the actual query based on your data model
      return NextResponse.json({
        total: 0,
        pending: 0,
        shortlisted: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
      });
    } else if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized to view application statistics" },
        { status: 403 }
      );
    }
    
    // Get overall count
    const total = await Application.countDocuments(statsQuery);
    
    // Get status-specific counts
    const pending = await Application.countDocuments({ ...statsQuery, status: 'pending' });
    const shortlisted = await Application.countDocuments({ ...statsQuery, status: 'shortlisted' });
    const accepted = await Application.countDocuments({ ...statsQuery, status: 'accepted' });
    const rejected = await Application.countDocuments({ ...statsQuery, status: 'rejected' });
    const withdrawn = await Application.countDocuments({ ...statsQuery, status: 'withdrawn' });
    
    return NextResponse.json({
      total,
      pending,
      shortlisted,
      accepted,
      rejected,
      withdrawn
    });
  } catch (error) {
    console.error("Error getting application statistics:", error);
    return NextResponse.json(
      { error: "Failed to get application statistics" },
      { status: 500 }
    );
  }
}