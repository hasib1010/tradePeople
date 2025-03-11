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
      // For pending verification:
      // - Email must be verified (user has signed up and verified email)
      // - Admin verification not yet done (isVerified = false)
      // - Account must be active (not disabled)
      query = {
        $and: [
          { isVerified: false },     // Not verified by admin yet
          { isActive: true },        // Account is active
          { verificationDate: { $exists: false } }  // Never been reviewed before
        ]
      };
    } else if (status === 'verified') {
      // For verified:
      // - Has been verified by admin
      query = {
        isVerified: true
      };
    } else if (status === 'rejected') {
      // For rejected:
      // - Has been reviewed (has verification date)
      // - Either not verified or not active
      query = {
        $and: [
          { verificationDate: { $exists: true } },  // Has been reviewed
          { $or: [
            { isVerified: false },     // Not verified
            { isActive: false }        // Or not active
          ]}
        ]
      };
    }
    
    // Add search filter if provided
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    // Add role filter - only tradespeople
    query.role = 'tradesperson';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    console.log("Query for tradespeople:", JSON.stringify(query, null, 2));
    
    // Execute queries in parallel for better performance
    const [tradespeople, totalCount] = await Promise.all([
      Tradesperson.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tradesperson.countDocuments(query)
    ]);
    
    console.log(`Found ${tradespeople.length} tradespeople with status: ${status}`);
    
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