// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import TempUser from "@/models/TempUser";
import { Customer } from "@/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const data = await request.json();
    await connectToDatabase();

    // Check if user already exists in the main User collection
    const existingUser = await Customer.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if user exists in the temporary collection
    const existingTempUser = await TempUser.findOne({ email: data.email });
    if (existingTempUser) {
      // If user exists but hasn't verified, generate a new token and send email again
      const verificationToken = existingTempUser.generateVerificationToken();
      await existingTempUser.save();
      
      // Create verification URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationURL = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      // Send verification email
      try {
        await sendEmail({
          to: existingTempUser.email,
          subject: "Verify Your Email - Tradie Service Marketplace",
          html: `
            <h1>Welcome to Tradie Service Marketplace!</h1>
            <p>Hello ${existingTempUser.firstName},</p>
            <p>We noticed you haven't verified your email yet. Please click the link below to verify your email:</p>
            <a href="${verificationURL}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify My Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
      }
      
      return NextResponse.json(
        { 
          success: true, 
          message: "A new verification email has been sent. Please check your inbox." 
        },
        { status: 200 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create new temporary user
    const newTempUser = new TempUser({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      role: "customer",
      location: {
        address: data.location?.address || "",
        city: data.location?.city || "",
        state: data.location?.state || "",
        postalCode: data.location?.postalCode || "",
        country: data.location?.country || "United States",
      }
    });

    // Generate verification token
    const verificationToken = newTempUser.generateVerificationToken();
    
    // Save temporary user
    await newTempUser.save();

    // Create verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationURL = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      await sendEmail({
        to: newTempUser.email,
        subject: "Verify Your Email - Tradie Service Marketplace",
        html: `
          <h1>Welcome to Tradie Service Marketplace!</h1>
          <p>Hello ${newTempUser.firstName},</p>
          <p>Thank you for registering. Please verify your email by clicking the link below:</p>
          <a href="${verificationURL}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify My Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
        `
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Continue registration process even if email fails
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Registration successful. Please check your email to verify your account." 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}