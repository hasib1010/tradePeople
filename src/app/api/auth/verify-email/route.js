// src/app/api/auth/verify-email/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import TempUser from "@/models/TempUser";
import { Customer, Tradesperson } from "@/models/User";
import { sendEmail } from "@/lib/email";

// POST - Verify email with token provided in request body
export async function POST(request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Hash the provided token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find temporary user with this token
    const tempUser = await TempUser.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!tempUser) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    
    // Create a new ObjectId for the user
    const userId = new mongoose.Types.ObjectId();
    
    // Prepare base user document with default coordinates to satisfy validation
    const baseUserDoc = {
      _id: userId,
      email: tempUser.email,
      password: tempUser.password, // Already hashed in temp collection
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      phoneNumber: tempUser.phoneNumber,
      // Include location with default coordinates
      location: tempUser.location || {
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        coordinates: {
          type: "Point",
          coordinates: [0, 0]  // Default coordinates (0,0) - "null island"
        }
      },
      // Email is verified, but for tradespeople, admin verification is still needed
      isVerified: tempUser.role === 'customer', // true for customers, false for tradespeople
      emailVerified: true, // New field to track email verification specifically
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };
    
    // Insert into users collection with appropriate role (discriminator key)
    if (tempUser.role === "customer") {
      const customerDoc = {
        ...baseUserDoc,
        role: "customer", // Discriminator key
        jobsPosted: [],
        favoriteTradespeople: []
      };
      
      await usersCollection.insertOne(customerDoc);
      console.log(`Customer user created with ID: ${userId}`);
    } 
    else if (tempUser.role === "tradesperson") {
      const tradespersonDoc = {
        ...baseUserDoc,
        role: "tradesperson", // Discriminator key
        businessName: tempUser.businessName || "",
        skills: tempUser.skills || [],
        yearsOfExperience: tempUser.yearsOfExperience || 0,
        hourlyRate: tempUser.hourlyRate || 0,
        description: tempUser.description || "",
        profileImage: tempUser.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg",
        certifications: tempUser.certifications || [],
        serviceArea: tempUser.serviceArea || { radius: 25, cities: [] },
        insurance: tempUser.insurance || { hasInsurance: false },
        // Initialize credits for tradesperson
        credits: {
          available: 5, // Give 5 free credits to new tradespeople
          spent: 0,
          history: []
        },
        averageRating: 0,
        totalReviews: 0,
        jobsApplied: [],
        jobsCompleted: []
      };
      
      await usersCollection.insertOne(tradespersonDoc);
      console.log(`Tradesperson user created with ID: ${userId}`);
    }
    
    // Try to find the user after creation to verify it was inserted properly
    const verifyUser = await usersCollection.findOne({ email: tempUser.email });
    if (verifyUser) {
      console.log(`User verification successful - User found in db with email: ${tempUser.email}`);
    } else {
      console.warn(`User inserted but verification lookup failed for email: ${tempUser.email}`);
    }
    
    // Delete temporary user
    await TempUser.deleteOne({ _id: tempUser._id });
    
    // Send appropriate welcome email based on role
    try {
      if (tempUser.role === "customer") {
        await sendEmail({
          to: tempUser.email,
          subject: "Welcome to Tradie Service Marketplace!",
          html: `
            <h1>Welcome to Tradie Service Marketplace!</h1>
            <p>Hello ${tempUser.firstName},</p>
            <p>Your email has been successfully verified. You can now log in to your account and start posting jobs to find skilled tradespeople for your projects.</p>
            <p>Thank you for joining our community!</p>
          `
        });
      } else {
        // For tradespeople, explain admin verification
        await sendEmail({
          to: tempUser.email,
          subject: "Email Verified - Next Steps for Your Tradesperson Account",
          html: `
            <h1>Email Verification Successful</h1>
            <p>Hello ${tempUser.firstName},</p>
            <p>Your email has been successfully verified. Thank you!</p>
            <p><strong>Next Steps:</strong> Our admin team will now review your credentials and documentation to complete your verification process. This typically takes 1-2 business days.</p>
            <p>Once your account is verified by our team, you'll receive another email notification and you'll be able to start applying for jobs.</p>
            <p>In the meantime, you can log in to your account and complete your profile.</p>
            <p>Thank you for your patience and for joining our platform!</p>
          `
        });
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue verification process even if email fails
    }
    
    const responseMessage = tempUser.role === "customer" 
      ? "Email verified successfully. You may now log in to your account."
      : "Email verified successfully. Your account is now pending admin verification, which usually takes 1-2 business days.";
      
    return NextResponse.json({
      success: true,
      message: responseMessage,
      role: tempUser.role
    });
    
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify email. Please try again or contact support." },
      { status: 500 }
    );
  }
}

// For requesting a new verification email
export async function PUT(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const tempUser = await TempUser.findOne({ email });
    
    if (!tempUser) {
      return NextResponse.json(
        { success: false, message: "No pending registration found for this email" },
        { status: 404 }
      );
    }
    
    // Generate a new verification token
    const verificationToken = tempUser.generateVerificationToken();
    await tempUser.save();
    
    // Create verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationURL = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    // Send verification email
    await sendEmail({
      to: tempUser.email,
      subject: "Verify Your Email Address",
      html: `
        <h1>Email Verification</h1>
        <p>Hello ${tempUser.firstName},</p>
        <p>Thank you for registering. Please verify your email by clicking the link below:</p>
        <a href="${verificationURL}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
      `
    });
    
    return NextResponse.json({
      success: true,
      message: "Verification email resent"
    });
    
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}