// src/app/api/admin/categories/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/db';
import TradeCategory from '@/models/TradeCategory';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT - Update a category
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await dbConnect();
        
        const { id } = params;
        const data = await request.json();
        
        // Add updater info
        data.updatedBy = session.user.id;
        
        const category = await TradeCategory.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );
        
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }
        
        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

// DELETE - Delete a category
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check if user is authenticated and is an admin
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await dbConnect();
        
        const { id } = params;
        
        const category = await TradeCategory.findByIdAndDelete(id);
        
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}