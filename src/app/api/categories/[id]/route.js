// src/app/api/categories/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TradeCategory from "@/models/TradeCategory";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const category = await TradeCategory.findById(id).lean();
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}