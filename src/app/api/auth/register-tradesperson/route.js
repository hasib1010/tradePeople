// src/app/api/auth/register-tradesperson/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import { uploadImage } from "@/lib/cloudinary";

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
    
    // Check if user already exists
    const existingUser = await Tradesperson.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
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
          isVerified: false
        };
      }
      return cert;
    });
    
    // Process insurance with document URL
    const processedInsurance = {
      ...insurance,
      documentUrl: insuranceDocumentUrl || "",
      isVerified: false
    };
    
    // Fix location coordinates - important for GeoJSON Point type
    const location = {
      ...locationData,
      coordinates: {
        type: "Point",
        // Use default coordinates if none provided, or omit coordinates entirely
        coordinates: [0, 0] // Default to [0,0] (null island) if no coordinates provided
      }
    };
    
    // Create new tradesperson
    const newTradesperson = new Tradesperson({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      businessName,
      skills,
      yearsOfExperience: yearsOfExperience || 0,
      hourlyRate: hourlyRate || 0,
      description,
      location,
      profileImage: profileImageUrl || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg",
      role: "tradesperson",
      certifications: processedCertifications,
      insurance: processedInsurance,
      serviceArea,
      credits: {
        available: 5, // Give 5 free credits to new tradespeople
        spent: 0
      }
    });
    
    await newTradesperson.save();
    
    return NextResponse.json(
      { success: true, message: "Tradesperson registered successfully" },
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