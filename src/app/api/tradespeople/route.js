// src/app/api/tradespeople/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    
    // Get query parameters
    const search = url.searchParams.get("search") || "";
    const skillsParam = url.searchParams.get("skills") || "";
    const skills = skillsParam ? skillsParam.split(',') : [];
    const city = url.searchParams.get("city") || "";
    const state = url.searchParams.get("state") || "";
    const minRating = parseFloat(url.searchParams.get("minRating") || "0");
    const availableNow = url.searchParams.get("availableNow") === "true";
    const minExperience = parseInt(url.searchParams.get("minExperience") || "0");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;
    
    await connectToDatabase();
    
    // Build query object
    const query = { 
      isActive: true,
      role: 'tradesperson'
    };
    
    // Search on name, skills, or business name
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by skills if provided
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
    
    // Fetch tradespeople with pagination
    const tradespeople = await Tradesperson.find(query)
      .select('firstName lastName businessName profileImage location skills yearsOfExperience hourlyRate availability averageRating totalReviews isVerified insurance')
      .sort({ averageRating: -1, totalReviews: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Tradesperson.countDocuments(query);
    
    return NextResponse.json({
      tradespeople,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error("Error fetching tradespeople:", error);
    return NextResponse.json(
      { error: "Failed to fetch tradespeople" },
      { status: 500 }
    );
  }
}