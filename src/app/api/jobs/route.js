// src/app/api/jobs/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "customer" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only customers can post jobs" }, { status: 403 });
    }

    const data = await request.json();
    await connectToDatabase();

    // Create default coordinates using a valid GeoJSON Point structure
    // This is a placeholder - in production you should use geocoding service
    const defaultCoordinates = {
      type: "Point",
      coordinates: [0, 0] // [longitude, latitude]
    };

    const newJob = new Job({
      title: data.title,
      description: data.description,
      category: data.category,
      subCategories: data.subCategories || [],
      requiredSkills: data.requiredSkills || [],
      budget: {
        type: data.budgetType || "negotiable",
        minAmount: data.minBudget,
        maxAmount: data.maxBudget,
        currency: data.currency || "USD",
      },
      location: {
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || "United States",
        coordinates: data.coordinates || defaultCoordinates,
      },
      customer: session.user.id,
      status: "open",
      timeline: {
        postedDate: new Date(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        expectedDuration: {
          value: data.durationValue,
          unit: data.durationUnit,
        },
      },
      attachments: data.attachments || [],
      isUrgent: data.isUrgent || false,
      visibility: data.visibility || "public",
    });

    await newJob.save();

    return NextResponse.json(
      { success: true, job: newJob, message: "Job created successfully" },
      { status: 201 }
    );
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
    if (category) query.category = category;
    if (city) query["location.city"] = city;

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get jobs with pagination
    const jobs = await Job.find(query)
      .sort({ "timeline.postedDate": -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "firstName lastName profileImage")
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