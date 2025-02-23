
// src/app/api/admin/users/recent/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(request) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Connect to database
        await connectToDatabase();

        // Get recent users, sorted by creation date
        const recentUsers = await User.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id firstName lastName email role profileImage createdAt isActive isVerified');

        // Format the response
        const formattedUsers = recentUsers.map(user => ({
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            isActive: user.isActive,
            isVerified: user.isVerified
        }));

        return NextResponse.json(formattedUsers);

    } catch (error) {
        console.error("Error fetching recent users:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent users" },
            { status: 500 }
        );
    }
}