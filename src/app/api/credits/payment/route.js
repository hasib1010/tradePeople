// src/app/api/credits/payment/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
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
        { error: "Only tradespeople can purchase credits" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate the request body
    if (!body.packageId) {
      return NextResponse.json(
        { error: "Missing package ID" },
        { status: 400 }
      );
    }
    
    // Credit packages (you would likely store these in your database)
    const creditPackages = {
      "basic": { credits: 10, price: 9.99, name: "Basic Credits Package" },
      "standard": { credits: 25, price: 19.99, name: "Standard Credits Package" },
      "premium": { credits: 60, price: 39.99, name: "Premium Credits Package" }
    };
    
    const selectedPackage = creditPackages[body.packageId];
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }
    
    // Calculate the price in cents for Stripe
    const amount = Math.round(selectedPackage.price * 100);
    
    try {
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        // Store metadata for later use
        metadata: {
          packageId: body.packageId,
          credits: selectedPackage.credits,
          userId: session.user.id
        },
        // Automatic payment methods
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      // Return the client secret so the client can complete the payment
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        package: {
          id: body.packageId,
          name: selectedPackage.name,
          credits: selectedPackage.credits,
          price: selectedPackage.price
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
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to process payment request" },
      { status: 500 }
    );
  }
}