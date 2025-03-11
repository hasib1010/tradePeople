// app/api/admin/tradespeople/[id]/credits/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Tradesperson } from '@/models/User';
import { isAdmin } from '@/lib/auth';

// POST handler - Add credits to a tradesperson
export async function POST(request, { params }) {
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

    // Validate credit amount
    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid credit amount' },
        { status: 400 }
      );
    }

    // Find the tradesperson
    const tradesperson = await Tradesperson.findById(id);

    if (!tradesperson) {
      return NextResponse.json(
        { message: 'Tradesperson not found' },
        { status: 404 }
      );
    }

    // Add credits using the model method
    await tradesperson.addCredits(
      data.amount,
      data.transactionType || 'bonus',
      null,
      null,
      data.notes || `Admin added ${data.amount} credits`
    );

    // Fetch the updated tradesperson with populated references
    const updatedTradesperson = await Tradesperson.findById(id)
      .populate('jobsApplied')
      .populate('jobsCompleted');

    return NextResponse.json(updatedTradesperson);
  } catch (error) {
    console.error('Error in POST /api/admin/tradespeople/[id]/credits:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET handler - Get credit history for a tradesperson
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
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Find the tradesperson
    const tradesperson = await Tradesperson.findById(id);

    if (!tradesperson) {
      return NextResponse.json(
        { message: 'Tradesperson not found' },
        { status: 404 }
      );
    }

    // Get credit history using the model method
    const creditHistory = tradesperson.getCreditHistory(limit);

    return NextResponse.json({
      available: tradesperson.credits?.available || 0,
      spent: tradesperson.credits?.spent || 0,
      history: creditHistory
    });
  } catch (error) {
    console.error('Error in GET /api/admin/tradespeople/[id]/credits:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}