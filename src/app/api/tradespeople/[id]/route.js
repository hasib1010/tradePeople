// src/app/api/tradespeople/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Review from "@/models/Review";

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

    // Initialize statistics with defaults if needed
    tradesperson.totalReviews = tradesperson.totalReviews || 0;
    tradesperson.averageRating = parseFloat(tradesperson.averageRating || 0);

    // For privacy/security, only return necessary email/phone data if verified
    if (!tradesperson.isVerified) {
      delete tradesperson.email;
      delete tradesperson.phoneNumber;
    }

    // Fetch reviews for this tradesperson
    const reviews = await Review.find({
      tradesperson: id,
      status: 'published'
    })
      .populate('reviewer', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(10)  // Limit to 10 most recent reviews
      .lean();
    
    if (reviews.length > 0) {
      // Calculate the average rating from the reviews
      const totalRating = reviews.reduce((sum, review) => sum + (parseFloat(review.rating) || 0), 0);
      tradesperson.averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
      tradesperson.totalReviews = reviews.length;
    }

    // Add reviews to the response
    tradesperson.reviews = reviews.map(review => ({
      _id: review._id,
      rating: parseFloat(review.rating || 0),
      title: review.title || '',
      content: review.content || '',
      projectName: review.projectName || '',
      createdAt: review.createdAt,
      reviewer: {
        firstName: review.reviewer?.firstName || 'Anonymous',
        lastName: review.reviewer?.lastName || 'User',
        profileImage: review.reviewer?.profileImage || null
      }
    }));

    return NextResponse.json(tradesperson);
  } catch (error) {
    console.error("Error fetching tradesperson:", error);
    return NextResponse.json(
      { error: "Failed to fetch tradesperson details" },
      { status: 500 }
    );
  }
}