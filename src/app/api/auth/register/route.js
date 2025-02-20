// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // Import bcrypt
import { connectToDatabase } from "@/lib/db";
import { Customer } from "@/models/User";

export async function POST(request) {
  try {
    const data = await request.json();
    await connectToDatabase();

    // Check if user exists
    const existingUser = await Customer.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create customer directly via data operations to bypass schema validation
    const result = await Customer.collection.insertOne({
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
      },
      isVerified: false,
      isActive: true,
      jobsPosted: [],
      favoriteTradespeople: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, message: "Registration successful" },
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
