"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle, X, AlertCircle, Star } from "lucide-react";

export default function CustomerDashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/dashboard/customer");
    },
  });

  // State initialization
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    ongoingProjects: 0,
    savedTradespeople: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModal, setReviewModal] = useState({ open: false, jobId: null });
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: "",
    attributes: { punctuality: 0, professionalism: 0, workQuality: 0, communication: 0, valueForMoney: 0 },
  });
  const [categories, setCategories] = useState([]);

  // Load dashboard data when authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect if not a customer
      if (session.user.role !== "customer") {
        redirect("/dashboard");
        return;
      }

      // Load all data
      loadDashboardData();
    }
  }, [status, session]);

  const loadFavorites = async () => {
    try {
      const response = await fetch("/api/customer/favorites");

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `API error: ${response.status}`;
        } catch (e) {
          errorMessage = `API error: ${response.status}`;
        }

        console.warn("Error loading favorites:", errorMessage);
        return []; // Return empty array on error, but continue
      }

      const data = await response.json();

      if (!data.favorites || !Array.isArray(data.favorites)) {
        console.warn("Invalid response format from favorites API");
        return [];
      }

      console.log(`Loaded ${data.favorites.length} favorite tradespeople`);

      // Update stats with the actual count of favorites
      setStats(prevStats => ({
        ...prevStats,
        savedTradespeople: data.favorites.length
      }));

      return data.favorites;
    } catch (error) {
      console.error("Error loading favorites:", error);
      return []; // Return empty array on error, but continue
    }
  };

  // Updated loadDashboardData function to include favorites
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First load categories
      await loadCategories();

      // Then load jobs
      await loadJobs();

      // Load favorite tradespeople
      await loadFavorites();

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        console.warn("Categories API returned error status:", response.status);
        return; // Don't throw error, continue without categories
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn("Categories API did not return an array:", data);
        return;
      }

      // Make sure each category has a string id
      const processedCategories = data.map(category => ({
        ...category,
        _id: category._id ? category._id.toString() : null
      }));

      setCategories(processedCategories);
      console.log("Categories loaded:", processedCategories.length);
    } catch (error) {
      console.warn("Error loading categories:", error);
      // Continue without categories
    }
  };

  // Get category name helper function
  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Unknown";

    // If the categoryId is already a string name (not an ObjectId format)
    if (typeof categoryId === 'string' && !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return categoryId;
    }

    // Convert to string to ensure consistent comparison
    const categoryIdStr = categoryId.toString();

    // Find matching category
    const category = categories.find(c => {
      const cId = c._id ? c._id.toString() : '';
      return cId === categoryIdStr;
    });

    return category ? category.name : "Unknown";
  };

  // Load jobs
  const loadJobs = async () => {
    try {
      const response = await fetch("/api/jobs");

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `API error: ${response.status}`;
        } catch (e) {
          errorMessage = `API error: ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.jobs || !Array.isArray(data.jobs)) {
        throw new Error("Invalid response format from jobs API");
      }

      // Filter to current user's jobs
      const userJobs = data.jobs.filter(job =>
        job.customer &&
        ((job.customer._id && job.customer._id === session.user.id) ||
          (job.customer.id && job.customer.id === session.user.id))
      );

      console.log(`Loaded ${userJobs.length} jobs for customer`);

      setStats(prevStats => ({
        activeJobs: userJobs.filter(job => job.status === "open" || job.status === "draft").length,
        completedJobs: userJobs.filter(job => job.status === "completed").length,
        ongoingProjects: userJobs.filter(job => job.status === "in-progress").length,
        savedTradespeople: prevStats.savedTradespeople || 0, // Preserve existing value
      }));

      // Process recent jobs
      const sortedJobs = [...userJobs]
        .sort((a, b) => {
          const dateA = a.timeline?.postedDate || a.createdAt || new Date();
          const dateB = b.timeline?.postedDate || b.createdAt || new Date();
          return new Date(dateB) - new Date(dateA);
        })
        .slice(0, 5);

      const processedJobs = sortedJobs.map(job => {
        // Determine category name from various possible sources
        let categoryName = "Unknown";

        if (job.categoryName) {
          // If API already provided categoryName
          categoryName = job.categoryName;
        } else if (job.category) {
          // If category is an object with name
          if (typeof job.category === 'object' && job.category !== null) {
            if (job.category.name) {
              categoryName = job.category.name;
            } else {
              categoryName = getCategoryName(job.category._id || job.category);
            }
          }
          // If category is an ID or string
          else {
            categoryName = getCategoryName(job.category);
          }
        }

        return {
          id: job._id,
          title: job.title || "Untitled Job",
          status: job.status || "draft",
          applications: job.applicationCount || (job.applications && job.applications.length) || 0,
          posted: job.timeline?.postedDate || job.createdAt || new Date(),
          category: categoryName,
          budget: job.budget,
        };
      });

      setRecentJobs(processedJobs);

      // Generate notifications from jobs
      generateNotifications(userJobs);

    } catch (error) {
      console.error("Error loading jobs:", error);
      throw error;
    }
  };

  // Generate notifications based on jobs
  const generateNotifications = (jobs) => {
    const newNotifications = [];

    jobs.forEach(job => {
      // Application notifications
      if (job.applicationCount > 0 || (job.applications && job.applications.length > 0)) {
        newNotifications.push({
          id: `app-${job._id}`,
          type: "application",
          message: `A tradesperson applied to your job: "${job.title}"`,
          date: new Date(),
          jobId: job._id,
          read: false,
        });
      }

      // New job approval notification
      if (job.status === "open" && job.createdAt) {
        const jobCreatedTime = new Date(job.createdAt).getTime();
        const now = Date.now();
        const hoursSinceCreated = (now - jobCreatedTime) / (1000 * 60 * 60);

        if (hoursSinceCreated < 24) {
          newNotifications.push({
            id: `approve-${job._id}`,
            type: "approval",
            message: `Your job "${job.title}" has been approved`,
            date: new Date(job.createdAt),
            jobId: job._id,
            read: false,
          });
        }
      }
    });

    // Sort by date (newest first) and take top 5
    newNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    setNotifications(newNotifications.slice(0, 5));
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Complete job handler
  const handleCompleteJob = async (jobId) => {
    try {
      setError(null);
      const job = recentJobs.find(job => job.id === jobId);
      if (!job) throw new Error("Job not found");

      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerFeedback: "Great work completed on time.",
          finalAmount: job.budget?.minAmount || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to complete job");
      }

      const data = await response.json();

      // Update job status in UI
      setRecentJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, status: "completed" } : job
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        ongoingProjects: prev.ongoingProjects - 1,
        completedJobs: prev.completedJobs + 1,
      }));

      // Add completion notification
      setNotifications(prev => [
        {
          id: `complete-${jobId}`,
          type: "completion",
          message: `Your job "${job.title}" has been marked as completed`,
          date: new Date(),
          jobId,
          read: false,
        },
        ...prev,
      ].slice(0, 5));

      // Open review modal
      setReviewModal({ open: true, jobId });

    } catch (error) {
      console.error("Error completing job:", error);
      setError(error.message || "Failed to complete job");
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);

      if (reviewForm.rating === 0) {
        throw new Error("Please provide a rating");
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: reviewModal.jobId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          attributes: reviewForm.attributes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to submit review");
      }

      // Close modal and reset form
      setReviewModal({ open: false, jobId: null });
      setReviewForm({
        rating: 0,
        comment: "",
        attributes: { punctuality: 0, professionalism: 0, workQuality: 0, communication: 0, valueForMoney: 0 },
      });

      // Add review notification
      const job = recentJobs.find(job => job.id === reviewModal.jobId);
      setNotifications(prev => [
        {
          id: `review-${reviewModal.jobId}`,
          type: "review",
          message: `You submitted a review for "${job?.title || 'your job'}"`,
          date: new Date(),
          jobId: reviewModal.jobId,
          read: false,
        },
        ...prev,
      ].slice(0, 5));

    } catch (error) {
      console.error("Error submitting review:", error);
      setError(error.message || "Failed to submit review");
    }
  };

  // Star rating handler
  const handleStarClick = (value) => {
    setReviewForm(prev => ({ ...prev, rating: value }));
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Error Loading Dashboard</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <details className="mt-2 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">Debug Information</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap">
              <p>Check the browser console for more details.</p>
              <p>API endpoints to check:</p>
              <ul className="list-disc pl-5">
                <li>/api/jobs - Main jobs endpoint</li>
                <li>/api/categories - Categories endpoint</li>
              </ul>
            </div>
          </details>
          <div className="mt-6">
            <button
              onClick={() => loadDashboardData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.firstName || session.user.name || "User"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your projects and connect with skilled tradespeople.
          </p>
          <hr className="border-1 mt-2 w-2/12 border-gray-400" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Active Job Postings"
                value={stats.activeJobs}
                icon={<svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                color="indigo"
                link="/jobs?status=open"
                linkText="View all postings"
              />
              <StatCard
                title="Completed Projects"
                value={stats.completedJobs}
                icon={<svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                color="green"
                link="/jobs?status=completed"
                linkText="View history"
              />
              <StatCard
                title="Ongoing Projects"
                value={stats.ongoingProjects}
                icon={<svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="yellow"
                link="/jobs?status=in-progress"
                linkText="Check status"
              />
              <StatCard
                title="Saved Tradespeople"
                value={stats.savedTradespeople}
                icon={<svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                color="red"
                link="/favorites"
                linkText="View professionals"
              />
            </div>

            {/* Recent Job Postings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Job Postings</h3>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:p-6">
                {recentJobs.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {recentJobs.map((job) => (
                        <li key={job.id} className="py-5">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <span
                                className={`inline-flex items-center justify-center h-12 w-12 rounded-md ${job.status === "open" ? "bg-blue-100" :
                                  job.status === "in-progress" ? "bg-yellow-100" :
                                    job.status === "completed" ? "bg-green-100" :
                                      job.status === "draft" ? "bg-purple-100" :
                                        "bg-gray-100"
                                  }`}
                              >
                                <svg
                                  className={`h-6 w-6 ${job.status === "open" ? "text-blue-600" :
                                    job.status === "in-progress" ? "text-yellow-600" :
                                      job.status === "completed" ? "text-green-600" :
                                        job.status === "draft" ? "text-purple-600" :
                                          "text-gray-600"
                                    }`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                              <div className="mt-1 flex items-center flex-wrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === "open" ? "bg-blue-100 text-blue-800" :
                                    job.status === "in-progress" ? "bg-yellow-100 text-yellow-800" :
                                      job.status === "completed" ? "bg-green-100 text-green-800" :
                                        job.status === "draft" ? "bg-purple-100 text-purple-800" :
                                          "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace(/-/g, ' ')}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {job.applications} {job.applications === 1 ? 'application' : 'applications'}
                                </span>
                                <span className="mx-1 text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{job.category}</span>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">
                                Posted on {new Date(job.posted).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/jobs/${job.id}`}
                                className="inline-flex items-center shadow-sm px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                              >
                                View
                              </Link>
                              {job.status === "in-progress" && (
                                <button
                                  onClick={() => handleCompleteJob(job.id)}
                                  className="inline-flex items-center shadow-sm px-3 py-1 border border-green-300 text-sm leading-5 font-medium rounded-full text-green-700 bg-green-50 hover:bg-green-100"
                                >
                                  Complete
                                </button>
                              )}
                              {job.status === "completed" && (
                                <button
                                  onClick={() => setReviewModal({ open: true, jobId: job.id })}
                                  className="inline-flex items-center shadow-sm px-3 py-1 border border-indigo-300 text-sm leading-5 font-medium rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No job postings</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by posting a new job.</p>
                    <Link
                      href="/jobs/post"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Job
                    </Link>
                  </div>
                )}
              </div>
              {recentJobs.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                  <Link href="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    View all job postings <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {/* Notifications */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  <Bell className="h-6 w-6 text-gray-500" />
                </div>
                {notifications.length > 0 ? (
                  <ul className="space-y-4">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={`p-4 rounded-md ${notification.read ? "bg-gray-50" : "bg-blue-50 border-l-4 border-blue-500"}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className={`text-sm ${notification.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(notification.date).toLocaleString()}
                            </p>
                            <Link
                              href={`/jobs/${notification.jobId}`}
                              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                            >
                              View Job
                            </Link>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markNotificationAsRead(notification.id)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No new notifications</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <ul className="divide-y divide-gray-200">
                  {[
                    { href: "/jobs/post", text: "Post New Job", icon: <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> },
                    { href: "/tradespeople", text: "Find Tradespeople", icon: <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
                    { href: "/messages", text: "Messages", icon: <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
                    { href: "/profile", text: "Edit Profile", icon: <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                  ].map((action) => (
                    <li key={action.href} className="py-4">
                      <Link href={action.href} className="group flex items-center">
                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                          {action.icon}
                        </span>
                        <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                          {action.text}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {reviewModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Review Tradesperson</h3>
                <button
                  onClick={() => setReviewModal({ open: false, jobId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overall Rating</label>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${star <= reviewForm.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        onClick={() => handleStarClick(star)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share your experience with the tradesperson..."
                    required
                  />
                </div>

                {/* Attribute Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate specific attributes</label>
                  <div className="space-y-3">
                    {Object.keys(reviewForm.attributes).map((attr) => (
                      <div key={attr} className="flex items-center">
                        <span className="w-1/3 text-sm text-gray-600 capitalize">
                          {attr.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex flex-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`${attr}-${star}`}
                              className={`h-5 w-5 cursor-pointer ${star <= reviewForm.attributes[attr] ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              onClick={() => setReviewForm((prev) => ({
                                ...prev,
                                attributes: {
                                  ...prev.attributes,
                                  [attr]: star
                                }
                              }))}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setReviewModal({ open: false, jobId: null })}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={reviewForm.rating === 0 || !reviewForm.comment}
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// StatCard Component for Reusability
function StatCard({ title, value, icon, color, link, linkText }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 bg-${color}-100 rounded-md p-3`}>{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <Link href={link} className={`text-sm font-medium text-${color}-600 hover:text-${color}-500`}>
          {linkText} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}