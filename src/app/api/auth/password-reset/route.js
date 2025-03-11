// src/app/api/auth/password-reset/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { sendEmail } from "@/lib/email"; // You'll need to create this email utility

// Request password reset email
export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists for security
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        message: "If a user with that email exists, a password reset link has been sent" 
      });
    }
    
    // Generate a reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // Create reset URL
    const resetURL = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    // Send password reset email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      `
    });
    
    return NextResponse.json({
      success: true,
      message: "If a user with that email exists, a password reset link has been sent"
    });
    
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}

// Reset password with token
export async function PUT(request) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Hash the provided token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find user with this token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Send password changed notification
    await sendEmail({
      to: user.email,
      subject: "Your Password Has Been Changed",
      html: `
        <h1>Password Changed</h1>
        <p>Hello ${user.firstName},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
      `
    });
    
    return NextResponse.json({
      success: true,
      message: "Password reset successful"
    });
    
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
}

// Verify reset token validity (for frontend validation)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Reset token is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Hash the provided token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find user with this token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Valid reset token"
    });
    
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify reset token" },
      { status: 500 }
    );
  }
}