// src/app/api/admin/users/[userId]/verify/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
 
export async function POST(request, context) {
    try {
        // Correctly access params from context
        const userId = context.params.userId;
        
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate userId
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        await connectToDatabase();

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already verified
        if (user.isVerified) {
            return NextResponse.json(
                { message: "User is already verified" },
                { status: 200 }
            );
        }

        // Mark user as verified
        user.isVerified = true;

        // Set default location structure if needed
        if (!user.location) {
            user.location = {
                address: "",
                city: "",
                state: "",
                postalCode: "",
                country: "United States",
                coordinates: {
                    type: "Point",
                    coordinates: [0, 0]
                }
            };
        } else if (!user.location.coordinates) {
            user.location.coordinates = {
                type: "Point",
                coordinates: [0, 0]
            };
        } else {
            // If coordinates structure exists but is incomplete
            if (!user.location.coordinates.type) {
                user.location.coordinates.type = "Point";
            }
            if (!Array.isArray(user.location.coordinates.coordinates) || 
                user.location.coordinates.coordinates.length !== 2) {
                user.location.coordinates.coordinates = [0, 0];
            }
        }

        // Try to save with specific error handling
        try {
            await user.save();
        } catch (saveError) {
            console.error("Error saving user:", saveError);
            
            // Try a more direct approach with update instead of save
            await User.updateOne(
                { _id: userId },
                { 
                    $set: { 
                        isVerified: true,
                        'location.coordinates': {
                            type: "Point",
                            coordinates: [0, 0]
                        }
                    }
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: "User verified successfully"
        });
    } catch (error) {
        console.error("Error verifying user:", error);
        return NextResponse.json(
            { error: "Failed to verify user: " + error.message },
            { status: 500 }
        );
    }
}