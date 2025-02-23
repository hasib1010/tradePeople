// src/app/api/subscriptions/payment/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Subscription from "@/models/Subscription";
import Stripe from "stripe";
import mongoose from 'mongoose'; // Ensure mongoose is imported

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
        { error: "Only tradespeople can subscribe to plans" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the request body
    if (!body.planId) {
      return NextResponse.json(
        { error: "Missing plan ID" },
        { status: 400 }
      );
    }

    // Validate that the planId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(body.planId)) {
      return NextResponse.json(
        { error: "Invalid plan ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the subscription plan
    const plan = await Subscription.findById(body.planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await Tradesperson.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
      // Create a Stripe customer if not exists
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user._id.toString()
          }
        });

        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      // Create a payment intent for the subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // in cents
        currency: 'usd',
        customer: customerId,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          isSubscription: 'true',
          billingPeriod: plan.billingPeriod,
          credits: plan.creditsPerPeriod.toString()
        },
        // Use automatic payment methods
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Return the client secret so the client can complete the payment
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        plan: {
          id: plan._id.toString(),
          name: plan.name,
          price: plan.price,
          billingPeriod: plan.billingPeriod,
          credits: plan.creditsPerPeriod
        }
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json(
        { error: stripeError.message || "Payment processing error" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error initializing subscription payment:", error);
    return NextResponse.json(
      { error: "Failed to initialize subscription" },
      { status: 500 }
    );
  }
}