// src/app/api/profile/verification-status/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only tradesperson users need to check verification
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ error: "Not a tradesperson account" }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Get the current verification status from the database
    const user = await Tradesperson.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the verification status with additional metadata
    return NextResponse.json({
      isVerified: user.isVerified,
      userId: user._id.toString(),
      lastChecked: new Date().toISOString(),
      // Include any other useful verification-related info
      certificationCount: user.certifications?.length || 0,
      hasInsurance: user.insurance?.hasInsurance || false,
      insuranceVerified: user.insurance?.isVerified || false
    });
  } catch (error) {
    console.error("Error checking verification status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check verification status", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}