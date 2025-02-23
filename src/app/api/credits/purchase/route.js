// src/app/api/credits/purchase/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

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

    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate the request body
    if (!body.packageId || !body.paymentMethodId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Credit packages (you would likely store these in your database)
    const creditPackages = {
      "basic": { credits: 10, price: 9.99 },
      "standard": { credits: 25, price: 19.99 },
      "premium": { credits: 60, price: 39.99 }
    };
    
    const selectedPackage = creditPackages[body.packageId];
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }
    
    // Start a transaction to ensure data consistency
    const session_db = await mongoose.startSession();
    session_db.startTransaction();
    
    try {
      // In a real implementation, you would process the payment here
      // using a payment processor like Stripe
      
      // For now, we'll simulate a successful payment
      const newTransaction = new Transaction({
        userId: session.user.id,
        amount: selectedPackage.credits,
        price: selectedPackage.price,
        type: "purchase",
        description: `Purchased ${selectedPackage.credits} credits`,
        status: "completed",
        paymentMethodId: body.paymentMethodId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newTransaction.save({ session: session_db });
      
      // Find the tradesperson
      const tradesperson = await Tradesperson.findById(session.user.id);
      
      if (!tradesperson) {
        throw new Error("Tradesperson not found");
      }
      
      // Initialize credits object if it doesn't exist
      if (!tradesperson.credits) {
        tradesperson.credits = {
          available: 0,
          spent: 0,
          history: []
        };
      }
      
      // Update user's credits
      const updatedTradesperson = await Tradesperson.findByIdAndUpdate(
        session.user.id,
        {
          $inc: {
            "credits.available": selectedPackage.credits,
          },
          $push: {
            "credits.history": {
              amount: selectedPackage.credits,
              transactionType: "purchase",
              relatedTo: newTransaction._id,
              relatedModel: "Transaction",
              date: new Date(),
              notes: `Purchased ${selectedPackage.credits} credits for $${selectedPackage.price}`
            }
          }
        },
        { new: true, session: session_db }
      );
      
      if (!updatedTradesperson) {
        throw new Error("Failed to update tradesperson credits");
      }
      
      // Commit the transaction
      await session_db.commitTransaction();
      session_db.endSession();
      
      return NextResponse.json({
        success: true,
        transaction: {
          id: newTransaction._id.toString(),
          amount: newTransaction.amount,
          type: newTransaction.type,
          description: newTransaction.description,
          status: newTransaction.status,
          date: newTransaction.createdAt
        },
        credits: {
          available: updatedTradesperson.credits.available,
          spent: updatedTradesperson.credits.spent || 0
        }
      });
    } catch (error) {
      // Abort the transaction on error
      await session_db.abortTransaction();
      session_db.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error processing credits purchase:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process credits purchase" },
      { status: 500 }
    );
  }
}