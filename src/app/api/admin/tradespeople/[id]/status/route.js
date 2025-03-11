// app/api/admin/tradespeople/[id]/status/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Tradesperson } from '@/models/User';
import { isAdmin } from '@/lib/auth';

// PATCH handler - Update tradesperson status
export async function PATCH(request, { params }) {
  try {
    // Check admin authorization
    const adminCheck = await isAdmin(request);
    if (!adminCheck.isAuthenticated) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { id } = params;
    const data = await request.json();

    // Validate the status update data
    if (typeof data.isActive !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    const tradesperson = await Tradesperson.findByIdAndUpdate(
      id,
      { $set: { isActive: data.isActive } },
      { new: true }
    );

    if (!tradesperson) {
      return NextResponse.json(
        { message: 'Tradesperson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tradesperson);
  } catch (error) {
    console.error('Error in PATCH /api/admin/tradespeople/[id]/status:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}