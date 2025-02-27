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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "tradesperson") {
      return NextResponse.json({ error: "Only tradespeople can access this endpoint" }, { status: 403 });
    }

    await connectToDatabase();
    const user = await Tradesperson.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get recent applications
    const recentApplications = await Application.find({ tradesperson: user._id })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate("job", "title")
      .lean();

    const applicationActivities = recentApplications.map((app) => ({
      id: `app-${app._id}`,
      type: "application",
      category: "application",
      date: app.lastUpdated || app.submittedAt,
      description: `You applied to "${app.job?.title || "a job"}" - ${formatStatus(app.status)}${
        app.creditDeducted ? " (1 credit deducted)" : ""
      }`,
      link: `/applications/${app._id}`,
      status: app.status,
    }));

    // Credit transactions
    const creditActivities = (user.credits?.history || [])
      .slice(0, 10)
      .map((transaction, index) => ({
        id: `credit-${index}`,
        type: "credit",
        category: "financial",
        date: transaction.date,
        description:
          transaction.transactionType === "purchase"
            ? transaction.relatedModel === "Subscription"
              ? `Received ${transaction.amount} credits from subscription`
              : `Purchased ${transaction.amount} credits`
            : transaction.transactionType === "usage"
            ? `Used ${Math.abs(transaction.amount)} credits for ${transaction.notes}`
            : transaction.transactionType === "refund"
            ? `Refunded ${transaction.amount} credits`
            : `Received ${transaction.amount} bonus credits`,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
      }));

    // Subscription activities
    const subscriptionActivities = user.subscription?.plan
      ? [{
          id: "subscription-active",
          type: "subscription",
          category: "financial",
          date: user.subscription.startDate,
          description: `Subscription active, ${user.subscription.autoRenew ? "renews" : "expires"} on ${new Date(
            user.subscription.endDate
          ).toLocaleDateString()}`,
          status: user.subscription.status,
          planId: user.subscription.plan,
        }]
      : [];

    // Payment transactions
    const recentTransactions = await Transaction.find({ userId: user._id, status: "completed" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const transactionActivities = recentTransactions.map((transaction) => ({
      id: `transaction-${transaction._id}`,
      type: "payment",
      category: "financial",
      date: transaction.createdAt,
      description: transaction.description,
      amount: transaction.amount,
      price: transaction.price,
      paymentType: transaction.type,
    }));

    const allActivities = [
      ...applicationActivities,
      ...creditActivities,
      ...subscriptionActivities,
      ...transactionActivities,
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    return NextResponse.json({ activities: allActivities });
  } catch (error) {
    console.error("Error fetching tradesperson activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity data" }, { status: 500 });
  }
}

function formatStatus(status) {
  return (
    {
      pending: "Pending Review",
      shortlisted: "Shortlisted",
      accepted: "Accepted",
      rejected: "Not Selected",
      withdrawn: "Withdrawn",
    }[status] || status.charAt(0).toUpperCase() + status.slice(1)
  );
}