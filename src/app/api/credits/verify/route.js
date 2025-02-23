// src/app/api/credits/verify/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
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
        { error: "Only tradespeople can verify credit purchases" },
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
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      body.paymentIntentId
    );
    
    // Check if the payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: "Payment has not been completed" },
        { status: 400 }
      );
    }
    
    // Verify that the payment is for the correct user
    if (paymentIntent.metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Payment verification failed: user mismatch" },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    // Check if this payment has already been processed
    const existingTransaction = await Transaction.findOne({
      'metadata.stripePaymentIntentId': body.paymentIntentId,
      status: 'completed'
    });
    
    if (existingTransaction) {
      // Payment was already processed, return success with the transaction details
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        credits: existingTransaction.amount,
        transaction: {
          id: existingTransaction._id.toString(),
          amount: existingTransaction.amount,
          date: existingTransaction.createdAt
        }
      });
    }
    
    // Credit packages (should match what's in your payment creation endpoint)
    const creditPackages = {
      "basic": { credits: 10, price: 9.99, name: "Basic Credits Package" },
      "standard": { credits: 25, price: 19.99, name: "Standard Credits Package" },
      "premium": { credits: 60, price: 39.99, name: "Premium Credits Package" }
    };
    
    const packageId = paymentIntent.metadata.packageId;
    const selectedPackage = creditPackages[packageId];
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package information" },
        { status: 400 }
      );
    }
    
    const creditsToAdd = parseInt(paymentIntent.metadata.credits || selectedPackage.credits);
    
    // Create a new transaction record
    const transaction = new Transaction({
      userId: session.user.id,
      amount: creditsToAdd,
      price: paymentIntent.amount / 100, // Convert cents back to dollars
      type: 'purchase',
      description: `Purchased ${creditsToAdd} credits`,
      status: 'completed',
      paymentMethodId: paymentIntent.payment_method,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        packageId: packageId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save the transaction
    await transaction.save();
    
    // Update the user's credits
    const tradesperson = await Tradesperson.findById(session.user.id);
    
    if (!tradesperson) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Add credits to the user's account
    await tradesperson.addCredits(
      creditsToAdd,
      'purchase',
      transaction._id,
      'Transaction',
      `Purchased ${packageId} package for ${creditsToAdd} credits`
    );
    
    return NextResponse.json({
      success: true,
      credits: creditsToAdd,
      transaction: {
        id: transaction._id.toString(),
        amount: transaction.amount,
        date: transaction.createdAt
      }
    });
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}