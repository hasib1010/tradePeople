// src/app/api/jobs/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import TradeCategory from "@/models/TradeCategory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "customer" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only customers can post jobs" }, { status: 403 });
    }

    // Connect to database first
    await connectToDatabase();
    
    // Parse request data
    const data = await request.json();
    
    // Debug logging
    console.log("Received job data:", {
      title: data.title,
      category: data.category,
      location: {
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode
      }
    });

    // Process category - check if it's a valid ObjectId and exists in database
    let categoryId;
    try {
      if (!data.category || !mongoose.Types.ObjectId.isValid(data.category)) {
        return NextResponse.json({ error: "Invalid category ID format" }, { status: 400 });
      }
      
      // Look up the category
      const category = await TradeCategory.findById(data.category);
      
      if (!category) {
        return NextResponse.json({ error: "Selected category not found" }, { status: 400 });
      }
      
      categoryId = data.category;
    } catch (error) {
      console.error("Error processing category:", error);
      return NextResponse.json({ error: "Error processing category" }, { status: 400 });
    }

    // Ensure required location fields are present
    const locationData = {
      address: data.address || "",
      city: data.city, 
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || "United States",
      coordinates: {
        type: "Point",
        coordinates: [0, 0] // Default coordinates
      }
    };
    
    // Validate required location fields
    if (!locationData.city || !locationData.state || !locationData.postalCode) {
      const missingFields = [];
      if (!locationData.city) missingFields.push("city");
      if (!locationData.state) missingFields.push("state");
      if (!locationData.postalCode) missingFields.push("postalCode");
      
      return NextResponse.json({ 
        error: "Missing required location fields", 
        missingFields 
      }, { status: 400 });
    }

    // Create job with all fields properly structured
    const jobData = {
      title: data.title,
      description: data.description,
      category: categoryId,
      // Don't include legacyCategory field at all - remove this line
      subCategories: data.subCategories || [],
      requiredSkills: data.requiredSkills || [],
      budget: {
        type: data.budgetType || "negotiable",
        minAmount: data.minBudget ? Number(data.minBudget) : undefined,
        maxAmount: data.maxBudget ? Number(data.maxBudget) : undefined,
        currency: data.currency || "USD",
      },
      location: locationData,
      customer: session.user.id,
      status: session.user.role === "admin" ? "open" : "draft", // Set as draft for customers
      timeline: {
        postedDate: new Date(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        expectedDuration: {
          value: data.durationValue ? Number(data.durationValue) : undefined,
          unit: data.durationUnit || "days",
        },
      },
      attachments: data.attachments || [], // Initial attachments
      isUrgent: data.isUrgent || false,
      visibility: data.visibility || "public",
      creditCost: session.user.role === "admin" ? 1 : undefined, // Default for admin direct posting
    };

    try {
      const newJob = new Job(jobData);
      
      // Validate before saving
      const validationResult = newJob.validateSync();
      if (validationResult) {
        console.error("Job validation errors:", JSON.stringify(validationResult.errors, null, 2));
        return NextResponse.json({ 
          error: "Job validation failed", 
          details: validationResult.errors
        }, { status: 400 });
      }
      
      // Save if validation passes
      const savedJob = await newJob.save();
      
      return NextResponse.json(
        {
          success: true,
          job: savedJob,
          message: session.user.role === "customer"
            ? "Job submitted for approval"
            : "Job created successfully"
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Job save error:", error);
      
      // Check if it's a validation error
      if (error.name === 'ValidationError') {
        return NextResponse.json({ 
          error: "Job validation failed", 
          details: error.errors,
          message: error.message
        }, { status: 400 });
      }
      
      // Other database errors
      return NextResponse.json({ 
        error: "Failed to save job", 
        message: error.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const city = url.searchParams.get("city");
    const status = url.searchParams.get("status") || "open";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build query
    const query = { status };
    
    // Handle category filtering
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        // If it's a valid ObjectId, search by category reference
        query.category = category;
      } else {
        // If not a valid ObjectId, search might not return results - consider how to handle this case
        console.warn("Invalid category ID format in search:", category);
      }
    }
    
    if (city) query["location.city"] = city;

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get jobs with pagination and populate references
    const jobs = await Job.find(query)
      .sort({ "timeline.postedDate": -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "firstName lastName profileImage")
      .populate("category", "name description icon") // Populate category details
      .lean();

    const total = await Job.countDocuments(query);

    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}