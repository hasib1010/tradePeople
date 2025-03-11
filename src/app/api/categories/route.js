// src/app/api/categories/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TradeCategory from "@/models/TradeCategory";

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') !== 'false'; // Default to true
    
    // Build query to get only active categories by default
    const query = activeOnly ? { isActive: true } : {};
    
    // Fetch categories and sort by displayOrder and name
    const categories = await TradeCategory.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .select('_id name description icon')
      .lean();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}