// src/app/api/reviews/route.js - Fixed to properly update tradesperson ratings
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import Job from "@/models/Job";
import { Tradesperson } from "@/models/User";
import mongoose from "mongoose";

// POST /api/reviews - Create a new review
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { job: jobId, tradesperson: tradespersonId, rating, title, content, categories, recommendationLikelihood } = body;

    // Validate required fields
    if (!jobId || !tradespersonId || !rating || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if IDs are valid MongoDB ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(tradespersonId)) {
      return NextResponse.json({ error: "Invalid job or tradesperson ID" }, { status: 400 });
    }

    // Check if the job exists and is completed
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    if (job.status !== "completed") {
      return NextResponse.json({ error: "Reviews can only be submitted for completed jobs" }, { status: 400 });
    }

    // Verify the job belongs to the reviewer (customer)
    if (job.customer.toString() !== session.user.id) {
      return NextResponse.json({ error: "You are not authorized to review this job" }, { status: 403 });
    }

    // Check if the tradesperson worked on the job
    if (job.selectedTradesperson.toString() !== tradespersonId) {
      return NextResponse.json({ error: "The tradesperson did not work on this job" }, { status: 400 });
    }

    // Check if the user has already reviewed this job
    const existingReview = await Review.findOne({ 
      job: jobId,
      reviewer: session.user.id 
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this job" }, { status: 400 });
    }

    // Create review
    const review = new Review({
      job: jobId,
      tradesperson: tradespersonId,
      reviewer: session.user.id,
      rating,
      title,
      content,
      categories: categories || {},
      recommendationLikelihood: recommendationLikelihood || 0,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Save the review
      await review.save({ session: dbSession });

      // Find the tradesperson
      const tradesperson = await Tradesperson.findById(tradespersonId);
      if (!tradesperson) {
        throw new Error("Tradesperson not found");
      }

      // Get all published reviews for this tradesperson including the new one
      const reviews = await Review.find({ 
        tradesperson: tradespersonId,
        status: 'published' 
      }).session(dbSession);

      const totalReviews = reviews.length;
      
      // Calculate average ratings
      let totalRating = 0;
      reviews.forEach(r => {
        totalRating += r.rating;
      });
      const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      
      // Calculate category averages if present
      const categoryAverages = {};
      if (reviews.some(r => r.categories)) {
        const categoryKeys = ['workQuality', 'communication', 'punctuality', 'valueForMoney'];
        
        categoryKeys.forEach(key => {
          const validReviews = reviews.filter(r => r.categories && typeof r.categories[key] === 'number');
          
          if (validReviews.length > 0) {
            const totalCategoryRating = validReviews.reduce((sum, r) => sum + r.categories[key], 0);
            categoryAverages[key] = totalCategoryRating / validReviews.length;
          }
        });
      }

      console.log(`Updating tradesperson ${tradespersonId} ratings:`, {
        avgRating,
        totalReviews,
        categoryAverages
      });

      // Update tradesperson rating data
      const updateResult = await Tradesperson.findByIdAndUpdate(
        tradespersonId,
        {
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: totalReviews,
          'ratings.average': parseFloat(avgRating.toFixed(1)),
          'ratings.totalReviews': totalReviews,
          'ratings.categoryAverages': categoryAverages
        },
        { session: dbSession, new: true }
      );

      console.log("Update result:", updateResult);

      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({
        success: true,
        message: "Review submitted successfully",
        review: {
          _id: review._id,
          rating: review.rating,
          title: review.title
        }
      });
    } catch (error) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  }
}

// GET /api/reviews - Get reviews (with optional filtering)
export async function GET(request) {
  try {
    // Parse URL and query parameters
    const url = new URL(request.url);
    const tradespersonId = url.searchParams.get('tradespersonId');
    const jobId = url.searchParams.get('jobId');
    const reviewerId = url.searchParams.get('reviewerId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    await connectToDatabase();

    // Build query
    let query = { status: 'published' };
    
    if (tradespersonId) {
      if (!mongoose.Types.ObjectId.isValid(tradespersonId)) {
        return NextResponse.json({ error: "Invalid tradesperson ID" }, { status: 400 });
      }
      query.tradesperson = tradespersonId;
    }
    
    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
      }
      query.job = jobId;
    }
    
    if (reviewerId) {
      if (!mongoose.Types.ObjectId.isValid(reviewerId)) {
        return NextResponse.json({ error: "Invalid reviewer ID" }, { status: 400 });
      }
      query.reviewer = reviewerId;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName profileImage')
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments(query);
    
    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reviews" }, { status: 500 });
  }
}