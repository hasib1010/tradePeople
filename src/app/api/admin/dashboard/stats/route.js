// src/app/api/admin/dashboard/stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User, Tradesperson, Customer } from "@/models/User";
import Job from "@/models/Job";
import Transaction from "@/models/Transaction";

export async function GET(request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get counts from database
    const [
      totalUsers,
      totalTradespeople, 
      totalCustomers,
      activeJobs,
      pendingCertifications,
      pendingInsurance
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "tradesperson" }),
      User.countDocuments({ role: "customer" }),
      Job.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
      Tradesperson.countDocuments({ 'certifications.isVerified': false }),
      Tradesperson.countDocuments({ 'insurance.isVerified': false })
    ]);

    // Get total credits in circulation
    const creditAggregate = await Tradesperson.aggregate([
      {
        $group: {
          _id: null,
          totalCredits: { $sum: "$credits.available" }
        }
      }
    ]);
    
    const totalCredits = creditAggregate.length > 0 ? creditAggregate[0].totalCredits : 0;

    // Get total revenue
    const revenueAggregate = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['purchase', 'subscription'] },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" }
        }
      }
    ]);
    
    const totalRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].totalRevenue : 0;

    // Combine verification counts
    const pendingVerifications = pendingCertifications + pendingInsurance;

    return NextResponse.json({
      totalUsers,
      totalTradespeople,
      totalCustomers,
      activeJobs,
      pendingVerifications,
      totalCredits,
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    });
    
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
