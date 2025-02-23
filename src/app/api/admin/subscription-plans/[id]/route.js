// src/app/api/admin/subscription-plans/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { isValidObjectId } from "mongoose";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET - Fetch a single subscription plan by ID
export async function GET(request, { params }) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid subscription plan ID" }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Fetch the subscription plan
    const plan = await Subscription.findById(id).lean();
    
    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }
    
    // Format the response
    const formattedPlan = {
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
      planCode: plan.planCode || ""
    };
    
    return NextResponse.json(formattedPlan);
    
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plan" },
      { status: 500 }
    );
  }
}

// PUT - Update a subscription plan
export async function PUT(request, { params }) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid subscription plan ID" }, { status: 400 });
    }
    
    // Validate request
    if (!body.name || !body.price || !body.billingPeriod || !body.credits) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the plan
    const plan = await Subscription.findById(id);
    
    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }
    
    // Check if another plan with the same name exists (excluding this plan)
    const existingPlan = await Subscription.findOne({ 
      name: body.name, 
      _id: { $ne: id }
    });
    
    if (existingPlan) {
      return NextResponse.json(
        { error: "Another plan with this name already exists" },
        { status: 400 }
      );
    }
    
    // Update Stripe product and price if they exist
    if (plan.stripeProductId) {
      try {
        await stripe.products.update(plan.stripeProductId, {
          name: body.name,
          description: body.description || `${body.name} Subscription Plan`,
          metadata: {
            planId: id.toString(),
            credits: body.credits.toString(),
            planCode: body.planCode || plan.planCode
          }
        });
        
        // Note: Stripe does not allow updating existing prices
        // If price has changed, create a new price and archive the old one
        if (plan.price !== body.price || plan.billingPeriod !== body.billingPeriod) {
          // Create new price
          const newPrice = await stripe.prices.create({
            product: plan.stripeProductId,
            unit_amount: Math.round(body.price * 100),
            currency: 'usd',
            recurring: {
              interval: body.billingPeriod === 'month' ? 'month' : 'year'
            },
            metadata: {
              planId: id.toString(),
              planCode: body.planCode || plan.planCode
            }
          });
          
          // Archive the old price if it exists
          if (plan.stripePriceId) {
            await stripe.prices.update(plan.stripePriceId, { active: false });
          }
          
          // Update the price ID in our plan
          plan.stripePriceId = newPrice.id;
        }
      } catch (stripeError) {
        console.error("Error updating Stripe product:", stripeError);
        // Continue with local update even if Stripe fails
      }
    }
    
    // Update plan
    plan.name = body.name;
    plan.description = body.description || `${body.name} Subscription Plan`;
    plan.price = body.price;
    plan.billingPeriod = body.billingPeriod;
    plan.creditsPerPeriod = body.credits;
    plan.features = body.features || [];
    plan.nonFeatures = body.nonFeatures || [];
    plan.featured = body.featured || false;
    plan.updatedAt = new Date();
    
    await plan.save();
    
    // Format response
    const formattedPlan = {
      id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      credits: plan.creditsPerPeriod,
      features: plan.features,
      nonFeatures: plan.nonFeatures,
      featured: plan.featured,
      isActive: plan.isActive,
      stripePriceId: plan.stripePriceId,
      stripeProductId: plan.stripeProductId,
      planCode: plan.planCode
    };
    
    return NextResponse.json(formattedPlan);
    
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to update subscription plan" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subscription plan
export async function DELETE(request, { params }) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid subscription plan ID" }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if the plan is in use
    const { Tradesperson } = await import('@/models/User');
    const usersWithPlan = await Tradesperson.countDocuments({ 'subscription.plan': id });
    
    if (usersWithPlan > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete this plan because it is currently in use",
          usersCount: usersWithPlan
        }, 
        { status: 400 }
      );
    }
    
    // Find the plan
    const plan = await Subscription.findById(id);
    
    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }
    
    // Archive Stripe product if it exists
    if (plan.stripeProductId) {
      try {
        await stripe.products.update(plan.stripeProductId, { active: false });
        
        // Archive the price if it exists
        if (plan.stripePriceId) {
          await stripe.prices.update(plan.stripePriceId, { active: false });
        }
      } catch (stripeError) {
        console.error("Error archiving Stripe product:", stripeError);
        // Continue with local deletion even if Stripe fails
      }
    }
    
    // Delete the plan
    await Subscription.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription plan" },
      { status: 500 }
    );
  }
}