"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle, CreditCard, DollarSign } from "lucide-react";

export default function TradespersonActivityContent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/dashboard/tradesperson/activity");
    },
  });

  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "tradesperson") {
      router.push("/dashboard");
      return;
    }

    const fetchActivity = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/activity", {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch activity data");
        const data = await response.json();
        setActivities(data.activities);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") fetchActivity();
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Activity</h1>
          <p className="mt-2 text-sm text-gray-600">
            Recent updates on your applications, credits, and transactions
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No recent activity to display.</p>
            <Link
              href="/jobs"
              className="mt-2 inline-block text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Browse Jobs to Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white shadow rounded-lg p-6 flex items-start space-x-4"
              >
                {/* Icon based on activity type */}
                <div className="flex-shrink-0">
                  {activity.type === "application" && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {activity.type === "credit" && (
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  )}
                  {activity.type === "subscription" && (
                    <CreditCard className="h-6 w-6 text-purple-500" />
                  )}
                  {activity.type === "payment" && (
                    <DollarSign className="h-6 w-6 text-yellow-500" />
                  )}
                </div>

                {/* Activity Details */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                  <p className="mt-1 text-gray-900">{activity.description}</p>
                  {activity.link && (
                    <Link
                      href={activity.link}
                      className="mt-1 inline-block text-sm text-blue-600 hover:text-blue-500"
                    >
                      View Details
                    </Link>
                  )}
                  {activity.status && (
                    <span
                      className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : activity.status === "shortlisted"
                          ? "bg-blue-100 text-blue-800"
                          : activity.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "rejected" || activity.status === "withdrawn"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  )}
                  {activity.amount && (
                    <p className="mt-1 text-sm text-gray-600">
                      Amount: {activity.amount > 0 ? "+" : ""}{activity.amount} credits
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Dashboard Link */}
        <div className="mt-8">
          <Link
            href="/dashboard/tradesperson"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}