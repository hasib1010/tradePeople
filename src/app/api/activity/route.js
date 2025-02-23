// src/app/api/activity/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Tradesperson } from "@/models/User";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Transaction from "@/models/Transaction";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make sure we're dealing with a tradesperson
    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Only tradespeople can access this endpoint" },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find the user
    const user = await Tradesperson.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent applications (last 10)
    const recentApplications = await Application.find({
      tradesperson: user._id
    })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate('job', 'title')
      .lean();

    // Map applications to activity format
    const applicationActivities = recentApplications.map(app => ({
      id: `app-${app._id}`,
      type: 'application',
      category: 'application',
      date: app.lastUpdated || app.submittedAt,
      description: `You applied to "${app.job?.title || 'a job'}" - ${formatStatus(app.status)}`,
      link: `/applications/${app._id}`,
      status: app.status
    }));

    // Get recent credit transactions (last 10)
    const creditTransactions = user.credits?.history || [];
    
    // Map credit transactions to activity format
    const creditActivities = creditTransactions
      .slice(0, 10)
      .map((transaction, index) => {
        let description = 'Credit activity';
        
        if (transaction.transactionType === 'purchase') {
          description = `You purchased ${transaction.amount} credits`;
          if (transaction.relatedModel === 'Subscription') {
            description = `You received ${transaction.amount} credits from your subscription`;
          }
        } else if (transaction.transactionType === 'usage') {
          description = `You used ${Math.abs(transaction.amount)} credits`;
        } else if (transaction.transactionType === 'refund') {
          description = `You were refunded ${transaction.amount} credits`;
        } else if (transaction.transactionType === 'bonus') {
          description = `You received ${transaction.amount} bonus credits`;
        }
        
        return {
          id: `credit-${index}`,
          type: 'credit',
          category: 'financial',
          date: transaction.date,
          description,
          amount: transaction.amount,
          transactionType: transaction.transactionType
        };
      });

    // Get subscription information if exists
    const subscriptionActivities = [];
    if (user.subscription?.plan) {
      subscriptionActivities.push({
        id: `subscription-active`,
        type: 'subscription',
        category: 'financial',
        date: user.subscription.startDate,
        description: `Your subscription is active and will ${user.subscription.autoRenew ? 'renew' : 'expire'} on ${new Date(user.subscription.endDate).toLocaleDateString()}`,
        status: user.subscription.status,
        planId: user.subscription.plan
      });
    }

    // Get recent payments (last 5)
    const recentTransactions = await Transaction.find({
      userId: user._id,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Map transactions to activity format
    const transactionActivities = recentTransactions.map(transaction => ({
      id: `transaction-${transaction._id}`,
      type: 'payment',
      category: 'financial',
      date: transaction.createdAt,
      description: transaction.description,
      amount: transaction.amount,
      price: transaction.price,
      paymentType: transaction.type
    }));

    // Combine all activities, sort by date (descending), and take the 20 most recent
    const allActivities = [
      ...applicationActivities,
      ...creditActivities,
      ...subscriptionActivities,
      ...transactionActivities
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    return NextResponse.json({
      activities: allActivities
    });
  } catch (error) {
    console.error("Error fetching tradesperson activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    );
  }
}

// Helper function to format application status for display
function formatStatus(status) {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'shortlisted':
      return 'Shortlisted';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Not Selected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}