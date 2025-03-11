// src/app/api/admin/categories/route.js
// Keep only the GET and POST handlers here
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/db';
import TradeCategory from '@/models/TradeCategory';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all categories
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check if user is authenticated
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await dbConnect();
        
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';
        
        // Build query
        const query = activeOnly ? { isActive: true } : {};
        
        // Fetch categories and sort by displayOrder
        const categories = await TradeCategory.find(query).sort({ displayOrder: 1, name: 1 });
        
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// POST - Create a new category
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await dbConnect();
        
        const data = await request.json();
        
        // Add creator info
        data.createdBy = session.user.id;
        
        const category = await TradeCategory.create(data);
        
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Failed to create category', details: error.message }, { status: 500 });
    }
}