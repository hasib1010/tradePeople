// src/app/api/subscriptions/plans/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Subscription from "@/models/Subscription";

// GET - Fetch all active subscription plans (public endpoint, no auth required)
export async function GET(request) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Fetch all active subscription plans
    const subscriptionPlans = await Subscription.find({ isActive: true })
      .sort({ price: 1 })
      .lean();
      
    // Format the response for the frontend
    const formattedPlans = subscriptionPlans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      credits: plan.creditsPerPeriod,
      features: plan.features || [],
      nonFeatures: plan.nonFeatures || [],
      featured: plan.featured || false,
      planCode: plan.planCode || ""
    }));
    
    return NextResponse.json(formattedPlans);
    
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}