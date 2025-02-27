// src/app/api/tradespeople/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Review from "@/models/Review";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    
    // Parse query parameters
    const search = url.searchParams.get('search') || '';
    const skills = url.searchParams.get('skills')?.split(',').filter(Boolean) || [];
    const city = url.searchParams.get('city') || '';
    const state = url.searchParams.get('state') || '';
    const minRating = parseFloat(url.searchParams.get('minRating') || '0');
    const availableNow = url.searchParams.get('availableNow') === 'true';
    const minExperience = parseInt(url.searchParams.get('minExperience') || '0', 10);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;
    
    await connectToDatabase();
    
    // Build the query
    let query = { 
      role: 'tradesperson',
      isActive: true,
      isVerified: true
    };
    
    // Search in name, business name, skills
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by skills
    if (skills.length > 0) {
      query.skills = { $in: skills };
    }
    
    // Filter by location
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      query['location.state'] = { $regex: state, $options: 'i' };
    }
    
    // Filter by rating
    if (minRating > 0) {
      query.averageRating = { $gte: minRating };
    }
    
    // Filter by availability
    if (availableNow) {
      query['availability.isAvailableNow'] = true;
    }
    
    // Filter by experience
    if (minExperience > 0) {
      query.yearsOfExperience = { $gte: minExperience };
    }
    
    // Execute query with pagination
    const tradespeople = await Tradesperson.find(query)
      .select('firstName lastName businessName profileImage location skills yearsOfExperience hourlyRate availability insurance averageRating totalReviews isVerified')
      .sort({ averageRating: -1, totalReviews: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Tradesperson.countDocuments(query);
    
    // Fetch recent reviews for each tradesperson
    const tradespeopleWithReviews = await Promise.all(
      tradespeople.map(async (person) => {
        const personObject = person.toObject();
        
        // Fetch 2 most recent reviews
        const reviews = await Review.find({ 
          tradesperson: person._id,
          status: 'published'
        })
        .populate('reviewer', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .limit(2);
        
        return {
          ...personObject,
          reviews: reviews.map(review => ({
            _id: review._id,
            rating: review.rating,
            title: review.title,
            content: review.content,
            createdAt: review.createdAt,
            reviewer: {
              firstName: review.reviewer?.firstName || 'Anonymous',
              lastName: review.reviewer?.lastName || 'User',
              profileImage: review.reviewer?.profileImage
            }
          }))
        };
      })
    );
    
    return NextResponse.json({
      tradespeople: tradespeopleWithReviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching tradespeople:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tradespeople" }, { status: 500 });
  }
}