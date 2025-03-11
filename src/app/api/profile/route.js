import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User, Customer, Tradesperson } from "@/models/User";

// GET handler: Fetch user profile
export async function GET(request) {
    try {
        // Get the session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "You must be logged in to view your profile" },
                { status: 401 }
            );
        }

        // Connect to the database
        await connectToDatabase();

        let user;

        // Handle based on user role
        switch (session.user.role) {
            case "tradesperson":
                // Fetch full profile for tradespeople
                user = await Tradesperson.findById(session.user.id).select('-password');
                break;
            case "customer":
                // Fetch only profileImage for customers
                user = await Customer.findById(session.user.id).select('profileImage -_id');
                break;
            default:
                // Restrict access for other roles (e.g., admin)
                return NextResponse.json(
                    { error: "Profile access is restricted to tradespeople and customers" },
                    { status: 403 }
                );
        }

        // Check if user exists
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

// PUT handler: Update user profile
export async function PUT(request) {
    try {
        // Get the session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "You must be logged in to update your profile" },
                { status: 401 }
            );
        }

        // Parse the request body
        const data = await request.json();

        // Connect to the database
        await connectToDatabase();

        let user;

        // Handle updates based on user role
        switch (session.user.role) {
            case "tradesperson":
                user = await Tradesperson.findById(session.user.id);
                if (!user) {
                    return NextResponse.json(
                        { error: "User profile not found" },
                        { status: 404 }
                    );
                }

                // Define allowed fields for tradespeople
                const tradespersonAllowedFields = [
                    'firstName', 'lastName', 'phoneNumber', 'location', 'profileImage', 'email',
                    'businessName', 'skills', 'yearsOfExperience', 'hourlyRate', 'description',
                    'availability', 'serviceArea', 'certifications', 'portfolio', 'insurance'
                ];

                // Update allowed fields
                for (const field of tradespersonAllowedFields) {
                    if (data[field] !== undefined) {
                        if (typeof data[field] === 'object' && data[field] !== null && !Array.isArray(data[field])) {
                            // Handle nested objects (e.g., location, availability)
                            if (!user[field]) user[field] = {};
                            for (const subField in data[field]) {
                                user[field][subField] = data[field][subField];
                            }
                        } else {
                            // Handle simple fields or arrays
                            user[field] = data[field];
                        }
                    }
                }
                break;

            case "customer":
                user = await Customer.findById(session.user.id);
                if (!user) {
                    return NextResponse.json(
                        { error: "User profile not found" },
                        { status: 404 }
                    );
                }

                // Restrict customers to only updating profileImage
                if (Object.keys(data).length > 1 || !('profileImage' in data)) {
                    return NextResponse.json(
                        { error: "Customers can only update their profile image" },
                        { status: 403 }
                    );
                }
                user.profileImage = data.profileImage;
                break;

            default:
                // Restrict updates for other roles
                return NextResponse.json(
                    { error: "Profile updates are restricted to tradespeople and customers" },
                    { status: 403 }
                );
        }

        // Save the updated user
        await user.save();

        // Prepare response without sensitive fields
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

// PATCH handler: Alias to PUT for compatibility
export async function PATCH(request) {
    return PUT(request);
}