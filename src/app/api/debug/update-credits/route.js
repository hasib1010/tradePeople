// src/app/api/debug/update-credits/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Transaction from "@/models/Transaction";

export async function GET(request) {
  try {
    // Get the user ID and amount from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const amount = parseInt(searchParams.get('amount') || '0');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the user
    const user = await Tradesperson.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Log original state
    console.log('Before update - Credits:', {
      available: user.credits?.available || 0,
      spent: user.credits?.spent || 0,
      historyCount: user.credits?.history?.length || 0
    });
    
    // Get all transactions for this user
    const transactions = await Transaction.find({ 
      userId: userId,
      type: 'purchase',
      status: 'completed'
    });
    
    console.log('Found transactions:', transactions.length);
    
    // Calculate total credits from transactions
    const totalCredits = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total spent
    const spentTransactions = await Transaction.find({
      userId: userId,
      type: 'usage',
      status: 'completed'
    });
    
    const totalSpent = spentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    console.log('Total from transactions:', {
      totalCredits,
      totalSpent
    });
    
    // Initialize credits if needed
    if (!user.credits) {
      user.credits = {
        available: 0,
        spent: 0,
        history: []
      };
    }
    
    // Force update the credits
    if (amount > 0) {
      user.credits.available = amount;
    } else {
      // Calculate available credits (purchased minus spent)
      user.credits.available = totalCredits - totalSpent;
    }
    
    user.credits.spent = totalSpent;
    
    // Save the changes
    await user.save();
    
    // Get the updated user
    const updatedUser = await Tradesperson.findById(userId);
    
    return NextResponse.json({
      success: true,
      userId,
      before: {
        available: user.credits?.available || 0,
        spent: user.credits?.spent || 0
      },
      after: {
        available: updatedUser.credits?.available || 0,
        spent: updatedUser.credits?.spent || 0
      },
      transactions: {
        totalPurchased: totalCredits,
        totalSpent: totalSpent,
        purchaseCount: transactions.length,
        spentCount: spentTransactions.length
      }
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}