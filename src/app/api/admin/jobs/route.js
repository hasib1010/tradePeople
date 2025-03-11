// src/app/api/admin/jobs/route.js - Complete solution
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import TradeCategory from "@/models/TradeCategory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all categories first
    console.log("Fetching all categories...");
    const allCategories = await TradeCategory.find({}).lean();
    console.log(`Found ${allCategories.length} categories`);
    
    // Create lookup maps
    const categoryIdMap = {};
    allCategories.forEach(cat => {
      categoryIdMap[cat._id.toString()] = cat.name;
    });
    
    console.log("Category ID map:", categoryIdMap);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch jobs
    console.log("Fetching jobs with query:", query);
    const jobs = await Job.find(query)
      .populate("customer", "firstName lastName email")
      .sort({ "timeline.postedDate": -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Found ${jobs.length} jobs`);

    // Process jobs to add categoryName field
    const processedJobs = jobs.map(job => {
      const catId = job.category ? job.category.toString() : null;
      console.log(`Processing job ${job._id}, category: ${catId}`);
      
      // If it's a valid ObjectId and we have it in our map
      if (catId && categoryIdMap[catId]) {
        job.categoryName = categoryIdMap[catId];
        console.log(`- Found category name: ${job.categoryName}`);
      }
      // If it's a string but not a valid ObjectId or not in our map
      else if (typeof job.category === 'string') {
        job.categoryName = job.category;
        console.log(`- Using category string: ${job.categoryName}`);
      }
      // Last resort
      else {
        job.categoryName = "Unknown";
        console.log("- Setting to Unknown");
      }
      
      return job;
    });

    const total = await Job.countDocuments(query);

    return NextResponse.json({
      jobs: processedJobs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}