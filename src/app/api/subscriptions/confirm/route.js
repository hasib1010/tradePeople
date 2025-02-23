// src/app/api/subscriptions/confirm/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Subscription from "@/models/Subscription";
import Transaction from "@/models/Transaction";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make sure we're dealing with a tradesperson
    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Only tradespeople can have subscriptions" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate the request body
    if (!body.paymentIntentId) {
      return NextResponse.json(
        { error: "Missing payment intent ID" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
    
    // Verify the payment intent status
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: "Payment has not been completed" },
        { status: 400 }
      );
    }
    
    // Make sure the payment intent belongs to this user
    if (paymentIntent.metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Payment does not belong to this user" },
        { status: 403 }
      );
    }
    
    // Verify that this is a subscription payment
    if (paymentIntent.metadata.isSubscription !== 'true') {
      return NextResponse.json(
        { error: "Payment is not for a subscription" },
        { status: 400 }
      );
    }
    
    // Get the plan ID from the payment intent metadata
    const planId = paymentIntent.metadata.planId;
    
    // Find the subscription plan
    const plan = await Subscription.findById(planId);
    
    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }
    
    // Find the user
    const user = await Tradesperson.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if the payment has already been processed
    const existingTransaction = await Transaction.findOne({
      metadata: {
        paymentIntentId: paymentIntent.id
      }
    });
    
    if (existingTransaction) {
      // Return the existing subscription data instead of creating a duplicate
      return NextResponse.json({
        message: "Subscription has already been activated",
        subscription: {
          id: plan._id.toString(),
          name: plan.name,
          price: plan.price,
          billingPeriod: plan.billingPeriod,
          credits: plan.creditsPerPeriod,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
        }
      });
    }
    
    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (plan.billingPeriod === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billingPeriod === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      amount: plan.creditsPerPeriod,
      price: plan.price,
      type: 'purchase',
      description: `Subscription to ${plan.name} plan`,
      status: 'completed',
      paymentMethodId: paymentIntent.payment_method,
      relatedId: plan._id,
      relatedType: 'Subscription',
      metadata: {
        paymentIntentId: paymentIntent.id,
        planId: plan._id.toString()
      }
    });
    
    await transaction.save();
    
    // Update user subscription
    user.subscription = {
      plan: plan._id,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
    };
    
    // Initialize credits if they don't exist
    if (!user.credits) {
      user.credits = {
        available: 0,
        spent: 0,
        history: []
      };
    }
    
    // Add credits directly to avoid validation issues
    user.credits.available += plan.creditsPerPeriod;
    
    // Add transaction to history using 'purchase' as the transaction type
    user.credits.history.push({
      amount: plan.creditsPerPeriod,
      transactionType: 'purchase', // Using a valid enum value
      relatedTo: plan._id,
      relatedModel: 'Subscription',
      date: new Date(),
      notes: `Subscription credits from ${plan.name} plan`
    });
    
    // Update last purchase info
    user.credits.lastPurchase = {
      date: new Date(),
      packageId: plan.planCode || plan._id.toString(),
      amount: plan.creditsPerPeriod,
      transactionId: transaction._id
    };
    
    await user.save();
    
    // Return success response with subscription details
    return NextResponse.json({
      message: "Subscription activated successfully",
      subscription: {
        id: plan._id.toString(),
        name: plan.name,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
        credits: plan.creditsPerPeriod,
        startDate,
        endDate,
      }
    });
    
  } catch (error) {
    console.error("Error confirming subscription:", error);
    return NextResponse.json(
      { error: "Failed to confirm subscription" },
      { status: 500 }
    );
  }
}