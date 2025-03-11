// app/api/admin/tradespeople/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Tradesperson } from '@/models/User';
import { isAdmin } from '@/lib/auth';

// GET handler - Fetch a tradesperson by ID
export async function GET(request, { params }) {
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

    const tradesperson = await Tradesperson.findById(id)
      .populate('jobsApplied')
      .populate('jobsCompleted');

    if (!tradesperson) {
      return NextResponse.json(
        { message: 'Tradesperson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tradesperson);
  } catch (error) {
    console.error('Error in GET /api/admin/tradespeople/[id]:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// PUT handler - Update a tradesperson by ID
export async function PUT(request, { params }) {
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

    // Fields that cannot be updated directly
    const protectedFields = [
      'password',
      'verificationToken',
      'verificationTokenExpires',
      'resetPasswordToken',
      'resetPasswordExpires'
    ];

    // Filter out protected fields
    Object.keys(data).forEach(key => {
      if (protectedFields.includes(key)) {
        delete data[key];
      }
    });

    const tradesperson = await Tradesperson.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('jobsApplied')
      .populate('jobsCompleted');

    if (!tradesperson) {
      return NextResponse.json(
        { message: 'Tradesperson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tradesperson);
  } catch (error) {
    console.error('Error in PUT /api/admin/tradespeople/[id]:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a tradesperson by ID
export async function DELETE(request, { params }) {
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

    const tradesperson = await Tradesperson.findByIdAndDelete(id);

    if (!tradesperson) {
      return NextResponse.json(
        { message: 'Tradesperson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Tradesperson deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/tradespeople/[id]:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}