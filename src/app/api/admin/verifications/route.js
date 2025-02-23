// src/app/api/admin/verifications/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";

export async function GET(request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    // Connect to database
    await connectToDatabase();
    
    // Build query based on status
    let query = {};
    
    if (status === 'pending') {
      query.isVerified = false;
      // Only include active accounts that haven't been explicitly rejected
      query.isActive = true;
    } else if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'rejected') {
      // For simplicity, we're treating rejected as active=false
      query.isActive = false;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add role filter - only tradespeople
    query.role = 'tradesperson';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries in parallel for better performance
    const [tradespeople, totalCount] = await Promise.all([
      Tradesperson.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tradesperson.countDocuments(query)
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      tradespeople,
      totalCount,
      totalPages,
      currentPage: page
    });
    
  } catch (error) {
    console.error("Error fetching verification data:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification data" },
      { status: 500 }
    );
  }
}
