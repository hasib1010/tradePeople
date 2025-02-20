// src/app/api/auth/check-user/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: "Email is required" 
      }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find user but don't return sensitive info
    const user = await User.findOne({ email }).select("role");
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { role: user.role } 
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}