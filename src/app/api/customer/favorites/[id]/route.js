
// src/app/api/customer/favorites/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Customer, Tradesperson } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST - Add a tradesperson to favorites
export async function POST(request, { params }) {
    try {
        const tradespersonId = params.id;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "customer") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await connectToDatabase();

        // Check if tradesperson exists
        const tradesperson = await Tradesperson.findById(tradespersonId);
        if (!tradesperson) {
            return NextResponse.json({ error: "Tradesperson not found" }, { status: 404 });
        }

        // Add to favorites if not already added
        const result = await Customer.findByIdAndUpdate(
            session.user.id,
            { $addToSet: { favoriteTradespeople: tradespersonId } },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Tradesperson added to favorites"
        });

    } catch (error) {
        console.error("Error adding to favorites:", error);
        return NextResponse.json(
            { error: "Failed to add to favorites" },
            { status: 500 }
        );
    }
}

// DELETE - Remove a tradesperson from favorites
export async function DELETE(request, { params }) {
    try {
        const tradespersonId = params.id;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "customer") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await connectToDatabase();

        // Remove from favorites
        const result = await Customer.findByIdAndUpdate(
            session.user.id,
            { $pull: { favoriteTradespeople: tradespersonId } },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Tradesperson removed from favorites"
        });

    } catch (error) {
        console.error("Error removing from favorites:", error);
        return NextResponse.json(
            { error: "Failed to remove from favorites" },
            { status: 500 }
        );
    }
}