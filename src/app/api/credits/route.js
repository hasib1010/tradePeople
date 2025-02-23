// src/app/api/credits/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Transaction from "@/models/Transaction";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Make sure we're dealing with a tradesperson
    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Only tradespeople can have credits" },
        { status: 403 }
      );
    }
    
    // Get user with credits information
    const user = await Tradesperson.findById(session.user.id).select("credits").lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get recent credit transactions
    const transactions = await Transaction.find({ 
      userId: session.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    // Format credits data for response
    const creditsData = {
      available: user.credits?.available || 0,
      spent: user.credits?.spent || 0,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        description: t.description,
        status: t.status,
        date: t.createdAt
      }))
    };
    
    return NextResponse.json(creditsData);
  } catch (error) {
    console.error("Error fetching credits data:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits data" },
      { status: 500 }
    );
  }
}

// Main credit purchase route - this will redirect to the specialized route
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Forward the request to the specialized purchase handler
    const purchaseResponse = await fetch(new URL('/api/credits/purchase', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass along the session cookie
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(await request.json())
    });
    
    // Return the response from the purchase handler
    const data = await purchaseResponse.json();
    return NextResponse.json(data, { status: purchaseResponse.status });
    
  } catch (error) {
    console.error("Error processing credits purchase:", error);
    return NextResponse.json(
      { error: "Failed to process credits purchase" },
      { status: 500 }
    );
  }
}