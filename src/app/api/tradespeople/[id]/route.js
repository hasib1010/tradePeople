// src/app/api/tradespeople/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    await connectToDatabase();
    
    const tradesperson = await Tradesperson.findById(id)
      .select(
        'firstName lastName email phoneNumber profileImage businessName description ' +
        'location skills yearsOfExperience hourlyRate availability certifications ' +
        'portfolio insurance serviceArea averageRating totalReviews isVerified ' +
        'jobsCompleted createdAt lastLogin'
      )
      .lean();
    
    if (!tradesperson) {
      return NextResponse.json(
        { error: "Tradesperson not found" },
        { status: 404 }
      );
    }
    
    // Calculate statistics if needed
    if (!tradesperson.totalReviews) {
      tradesperson.totalReviews = 0;
    }
    
    if (!tradesperson.averageRating) {
      tradesperson.averageRating = 0;
    }
    
    // For privacy/security, only return necessary email/phone data if verified
    if (!tradesperson.isVerified) {
      delete tradesperson.email;
      delete tradesperson.phoneNumber;
    }
    
    return NextResponse.json(tradesperson);
  } catch (error) {
    console.error("Error fetching tradesperson:", error);
    return NextResponse.json(
      { error: "Failed to fetch tradesperson details" },
      { status: 500 }
    );
  }
}