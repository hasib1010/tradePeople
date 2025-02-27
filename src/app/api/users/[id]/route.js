// src/app/api/users/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User, Customer, Tradesperson } from "@/models/User";
import mongoose from "mongoose";

// GET /api/users/:id - Get user details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Check if valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Get the session to check authentication
    const session = await getServerSession(authOptions);
    
    // Check if user exists in general user collection
    let user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Convert to plain object
    let userData = user.toObject();
    
    // Remove sensitive fields
    if (userData.password) delete userData.password;
    
    // If this is a tradesperson, get additional tradesperson-specific data
    if (user.role === 'tradesperson') {
      try {
        // Explicitly query the tradesperson model to ensure we get all fields
        const tradesperson = await Tradesperson.findById(id)
          .select('businessName skills yearsOfExperience certifications portfolio availability serviceArea averageRating totalReviews');
          
        if (tradesperson) {
          // Merge the data
          userData = {
            ...userData,
            businessName: tradesperson.businessName,
            skills: tradesperson.skills,
            yearsOfExperience: tradesperson.yearsOfExperience,
            certifications: tradesperson.certifications,
            portfolio: tradesperson.portfolio,
            availability: tradesperson.availability,
            serviceArea: tradesperson.serviceArea,
            averageRating: tradesperson.averageRating,
            totalReviews: tradesperson.totalReviews
          };
        }
      } catch (err) {
        console.error('Error fetching tradesperson details:', err);
        // Continue with basic user data if tradesperson data fails
      }
    } 
    // If this is a customer, get additional customer-specific data
    else if (user.role === 'customer') {
      try {
        // Explicitly query the customer model
        const customer = await Customer.findById(id).select('favoriteTradespeople');
          
        if (customer) {
          // Only add non-sensitive fields
          userData = {
            ...userData,
            favoriteTradespeople: customer.favoriteTradespeople
          };
        }
      } catch (err) {
        console.error('Error fetching customer details:', err);
        // Continue with basic user data if customer data fails
      }
    }
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}