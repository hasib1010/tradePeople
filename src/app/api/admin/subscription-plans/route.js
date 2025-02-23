// src/app/api/admin/subscription-plans/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Subscription from "@/models/Subscription";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET - Fetch all subscription plans
export async function GET(request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Fetch all subscription plans
    const subscriptionPlans = await Subscription.find({})
      .sort({ price: 1 })
      .lean();
      
    // Format the response
    const formattedPlans = subscriptionPlans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      credits: plan.creditsPerPeriod,
      features: plan.features || [],
      nonFeatures: plan.nonFeatures || [],
      featured: plan.featured || false,
      isActive: plan.isActive,
      stripePriceId: plan.stripePriceId,
      stripeProductId: plan.stripeProductId,
      planCode: plan.planCode || "" // Optional plan code for reference
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

// POST - Create a new subscription plan
export async function POST(request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    if (!body.name || !body.price || !body.billingPeriod || !body.credits) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if plan with the same name already exists
    const existingPlan = await Subscription.findOne({ name: body.name });
    
    if (existingPlan) {
      return NextResponse.json(
        { error: "A plan with this name already exists" },
        { status: 400 }
      );
    }
    
    // Create a product in Stripe
    let stripeProduct;
    let stripePrice;
    
    try {
      // Create the product in Stripe
      stripeProduct = await stripe.products.create({
        name: body.name,
        description: body.description || `${body.name} Subscription Plan`,
        metadata: {
          planCode: body.id, // Store the original id as planCode for reference
          credits: body.credits.toString()
        }
      });
      
      // Create the price in Stripe
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(body.price * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: body.billingPeriod === 'month' ? 'month' : 'year'
        },
        metadata: {
          planCode: body.id
        }
      });
    } catch (stripeError) {
      console.error("Error creating product in Stripe:", stripeError);
      // Continue creating the plan locally even if Stripe fails
    }
    
    // Create new subscription plan with auto-generated MongoDB _id
    const newPlan = new Subscription({
      name: body.name,
      description: body.description || `${body.name} Subscription Plan`,
      price: body.price,
      billingPeriod: body.billingPeriod,
      creditsPerPeriod: body.credits,
      features: body.features || [],
      nonFeatures: body.nonFeatures || [],
      isActive: true,
      featured: body.featured || false,
      stripePriceId: stripePrice?.id,
      stripeProductId: stripeProduct?.id,
      planCode: body.id // Store the original id as planCode for reference
    });
    
    await newPlan.save();
    
    // Format response
    const formattedPlan = {
      id: newPlan._id.toString(),
      name: newPlan.name,
      description: newPlan.description,
      price: newPlan.price,
      billingPeriod: newPlan.billingPeriod,
      credits: newPlan.creditsPerPeriod,
      features: newPlan.features,
      nonFeatures: newPlan.nonFeatures,
      featured: newPlan.featured,
      isActive: newPlan.isActive,
      stripePriceId: newPlan.stripePriceId,
      stripeProductId: newPlan.stripeProductId,
      planCode: newPlan.planCode
    };
    
    return NextResponse.json(formattedPlan, { status: 201 });
    
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to create subscription plan" },
      { status: 500 }
    );
  }
}
