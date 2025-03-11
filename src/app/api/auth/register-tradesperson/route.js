// src/app/api/auth/register-tradesperson/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import TempUser from "@/models/TempUser";
import { Tradesperson } from "@/models/User";
import { uploadImage } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const phoneNumber = formData.get("phoneNumber");
    const businessName = formData.get("businessName");
    const skills = JSON.parse(formData.get("skills") || "[]");
    const yearsOfExperience = formData.get("yearsOfExperience");
    const hourlyRate = formData.get("hourlyRate");
    const description = formData.get("description");
    const profileImage = formData.get("profileImage");
    const locationData = JSON.parse(formData.get("location") || "{}");
    const certifications = JSON.parse(formData.get("certifications") || "[]");
    const insurance = JSON.parse(formData.get("insurance") || "{}");
    const serviceArea = JSON.parse(formData.get("serviceArea") || "{}");
    const licenseDocument = formData.get("licenseDocument");
    const insuranceDocument = formData.get("insuranceDocument");
    
    await connectToDatabase();
    
    // Check if user already exists in the main User collection
    const existingUser = await Tradesperson.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Check if user exists in temporary collection
    const existingTempUser = await TempUser.findOne({ email });
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
    
    // Upload profile image if provided
    let profileImageUrl = null;
    if (profileImage && profileImage.size > 0) {
      const buffer = await profileImage.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const dataURI = `data:${profileImage.type};base64,${base64Image}`;
      profileImageUrl = await uploadImage(dataURI, "tradePeople/profiles");
    }
    
    // Upload license document if provided
    let licenseDocumentUrl = null;
    if (licenseDocument && licenseDocument.size > 0) {
      const buffer = await licenseDocument.arrayBuffer();
      const base64Doc = Buffer.from(buffer).toString('base64');
      const dataURI = `data:${licenseDocument.type};base64,${base64Doc}`;
      licenseDocumentUrl = await uploadImage(dataURI, "tradePeople/licenses");
    }
    
    // Upload insurance document if provided
    let insuranceDocumentUrl = null;
    if (insuranceDocument && insuranceDocument.size > 0) {
      const buffer = await insuranceDocument.arrayBuffer();
      const base64Doc = Buffer.from(buffer).toString('base64');
      const dataURI = `data:${insuranceDocument.type};base64,${base64Doc}`;
      insuranceDocumentUrl = await uploadImage(dataURI, "tradePeople/insurance");
    }
    
    // Process certifications with document URL
    const processedCertifications = certifications.map((cert, index) => {
      if (index === 0 && licenseDocumentUrl) {
        return {
          ...cert,
          documentUrl: licenseDocumentUrl,
        };
      }
      return cert;
    });
    
    // Process insurance with document URL
    const processedInsurance = {
      ...insurance,
      documentUrl: insuranceDocumentUrl || "",
    };
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Add default coordinates to the location data
    const enhancedLocation = {
      ...locationData,
      // Add default coordinates to pass validation
      coordinates: {
        type: "Point",
        coordinates: [0, 0] // Default to "null island" (0,0)
      }
    };
    
    // Create new temporary user
    const newTempUser = new TempUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: "tradesperson",
      // Use the enhanced location with coordinates
      location: enhancedLocation,
      // Tradesperson specific fields
      businessName,
      skills,
      yearsOfExperience: yearsOfExperience || 0,
      hourlyRate: hourlyRate || 0,
      description,
      profileImage: profileImageUrl || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg",
      certifications: processedCertifications,
      insurance: processedInsurance,
      serviceArea,
    });
    
    // Generate verification token
    const verificationToken = newTempUser.generateVerificationToken();
    
    // Save the temporary user
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
          <p>Thank you for registering as a tradesperson. Please verify your email by clicking the link below:</p>
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
    console.error("Tradesperson registration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Registration failed",
        error: error.toString()
      },
      { status: 500 }
    );
  }
}