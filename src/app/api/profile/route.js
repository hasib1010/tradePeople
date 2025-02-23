    // src/app/api/profile/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User, Customer, Tradesperson } from "@/models/User";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view your profile" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    let user;
    
    if (session.user.role === 'tradesperson') {
      user = await Tradesperson.findById(session.user.id).select('-password');
    } else if (session.user.role === 'customer') {
      user = await Customer.findById(session.user.id).select('-password');
    } else {
      user = await User.findById(session.user.id).select('-password');
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    await connectToDatabase();
    
    let user;
    
    if (session.user.role === 'tradesperson') {
      user = await Tradesperson.findById(session.user.id);
    } else if (session.user.role === 'customer') {
      user = await Customer.findById(session.user.id);
    } else {
      user = await User.findById(session.user.id);
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }
    
    // List of fields that can be updated
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'location'
    ];
    
    // Add role-specific allowed fields
    if (session.user.role === 'tradesperson') {
      allowedFields.push(
        'businessName', 'skills', 'hourlyRate', 'description',
        'availability', 'serviceArea'
      );
    }
    
    // Update only allowed fields
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    }
    
    await user.save();
    
    // Return updated user without sensitive fields
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user profile" },
      { status: 500 }
    );
  }
}