// src/app/api/customer/favorites/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Customer, Tradesperson } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Fetch all favorites
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "customer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Get customer with populated favorites
    const customer = await Customer.findById(session.user.id)
      .populate({
        path: 'favoriteTradespeople',
        select: 'firstName lastName businessName profileImage averageRating totalReviews location skills'
      })
      .lean();
      
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      favorites: customer.favoriteTradespeople || [] 
    });
    
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
