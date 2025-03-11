"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";

export default function TradespersonDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/dashboard/tradesperson");
    },
  }); 
  useEffect(() => {
    // Check role when authenticated
    if (status === "authenticated" && session?.user?.role !== "tradesperson") {
      // Redirect to the appropriate dashboard based on role
      router.push(`/dashboard/${session?.user?.role || ""}`);
    }
  }, [status, session, router]);

  const [dashboardData, setDashboardData] = useState({
    availableJobs: 0,
    applications: {
      total: 0,
      pending: 0,
      shortlisted: 0,
      accepted: 0
    },
    credits: 0,
    recentActivity: [],
    loading: true,
    error: null,
    // Add job progress data
    jobProgress: {
      inProgress: 0,
      completed: 0,
      totalEarnings: 0,
      currentJobs: []
    }
  });

  // Separate loading states for different data types
  const [loadingStates, setLoadingStates] = useState({
    jobs: true,
    applications: true,
    profile: true,
    activity: true,
    jobProgress: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status !== "authenticated") return;

      // Fetch available jobs count (matching tradesperson skills)
      fetchJobsData();

      // Fetch applications data
      fetchApplicationsData();

      // Fetch user profile with credits info
      fetchProfileData();

      // Fetch recent activity
      fetchActivityData();

      // Fetch job progress data
      fetchJobProgressData();
    };

    const fetchJobsData = async () => {
      try {
        const jobsResponse = await fetch('/api/jobs/matching');
        if (!jobsResponse.ok) throw new Error("Failed to load matching jobs");
        const jobsData = await jobsResponse.json();

        setDashboardData(prev => ({
          ...prev,
          availableJobs: jobsData.count || 0
        }));
      } catch (error) {
        console.error("Error fetching jobs data:", error);
        setDashboardData(prev => ({
          ...prev,
          error: prev.error || "Failed to load some dashboard data"
        }));
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          jobs: false
        }));
      }
    };

    const fetchApplicationsData = async () => {
      try {
        const applicationsResponse = await fetch('/api/applications/stats');
        if (!applicationsResponse.ok) throw new Error("Failed to load application stats");
        const applicationsData = await applicationsResponse.json();

        setDashboardData(prev => ({
          ...prev,
          applications: {
            total: applicationsData.total || 0,
            pending: applicationsData.pending || 0,
            shortlisted: applicationsData.shortlisted || 0,
            accepted: applicationsData.accepted || 0
          }
        }));
      } catch (error) {
        console.error("Error fetching applications data:", error);
        setDashboardData(prev => ({
          ...prev,
          error: prev.error || "Failed to load some dashboard data"
        }));
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          applications: false
        }));
      }
    };

    const fetchProfileData = async () => {
      try {
        const profileResponse = await fetch('/api/profile');
        if (!profileResponse.ok) throw new Error("Failed to load profile data");
        const profileData = await profileResponse.json();

        setDashboardData(prev => ({
          ...prev,
          credits: profileData.user?.credits?.available || 0
        }));
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setDashboardData(prev => ({
          ...prev,
          error: prev.error || "Failed to load some dashboard data"
        }));
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          profile: false
        }));
      }
    };

    const fetchActivityData = async () => {
      try {
        const activityResponse = await fetch('/api/activity');
        if (!activityResponse.ok) throw new Error("Failed to load activity data");
        const activityData = await activityResponse.json();

        setDashboardData(prev => ({
          ...prev,
          recentActivity: activityData.activities || []
        }));
      } catch (error) {
        console.error("Error fetching activity data:", error);
        setDashboardData(prev => ({
          ...prev,
          error: prev.error || "Failed to load some dashboard data"
        }));
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          activity: false
        }));
      }
    };

    const fetchJobProgressData = async () => {
      try {
        // Fetch jobs where tradesperson is selected and status is in-progress or completed
        const jobsResponse = await fetch('/api/jobs/tradesperson');
        if (!jobsResponse.ok) throw new Error("Failed to load job progress data");
        const jobsData = await jobsResponse.json();

        // Calculate totals and in-progress jobs
        const inProgressJobs = jobsData.jobs.filter(job => job.status === 'in-progress');
        const completedJobs = jobsData.jobs.filter(job => job.status === 'completed');
        const totalEarnings = completedJobs.reduce((total, job) =>
          total + (job.completionDetails?.finalAmount || 0), 0);

        setDashboardData(prev => ({
          ...prev,
          jobProgress: {
            inProgress: inProgressJobs.length,
            completed: completedJobs.length,
            totalEarnings,
            currentJobs: inProgressJobs.map(job => ({
              id: job._id,
              title: job.title,
              customer: job.customer,
              startDate: job.timeline?.startDate,
              expectedEndDate: job.timeline?.endDate,
              expectedDuration: job.timeline?.expectedDuration,
              location: job.location,
              status: job.status,
              // Calculate progress based on timeline if available
              progress: calculateJobProgress(job)
            }))
          }
        }));
      } catch (error) {
        console.error("Error fetching job progress data:", error);
        setDashboardData(prev => ({
          ...prev,
          error: prev.error || "Failed to load some dashboard data"
        }));
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          jobProgress: false
        }));
      }
    };

    // Helper function to calculate job progress percentage
    const calculateJobProgress = (job) => {
      if (job.status === 'completed') return 100;
      if (job.status !== 'in-progress') return 0;

      // If the job has a start and end date, calculate progress based on timeline
      if (job.timeline?.startDate && job.timeline?.endDate) {
        const startDate = new Date(job.timeline.startDate);
        const endDate = new Date(job.timeline.endDate);
        const currentDate = new Date();

        // If job hasn't started yet
        if (currentDate < startDate) return 0;

        // If job is past due date but not completed
        if (currentDate > endDate) return 90; // Cap at 90% if overdue

        // Calculate percentage based on timeline
        const totalDuration = endDate - startDate;
        const elapsedDuration = currentDate - startDate;
        const progressPercentage = Math.round((elapsedDuration / totalDuration) * 100);

        return Math.min(progressPercentage, 90); // Cap at 90% for in-progress jobs
      }

      // Default value if no timeline data available
      return 50;
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  // Update overall loading state when all individual loading states are false
  useEffect(() => {
    if (!loadingStates.jobs && !loadingStates.applications &&
      !loadingStates.profile && !loadingStates.activity &&
      !loadingStates.jobProgress) {
      setDashboardData(prev => ({
        ...prev,
        loading: false
      }));
    }
  }, [loadingStates]);

  if (status === "loading" || dashboardData.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format number as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate other applications (those not in pending, shortlisted, or accepted state)
  const otherApplications = Math.max(
    0,
    dashboardData.applications.total -
    (dashboardData.applications.pending +
      dashboardData.applications.shortlisted +
      dashboardData.applications.accepted)
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {session?.user?.firstName || session?.user?.name || 'Tradesperson'}! Here's what's happening with your account.
          </p>
          <hr className="border-1 mt-2 w-2/12 border-gray-400" />
        </div>

        {dashboardData.error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{dashboardData.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Summary Stats */}
        <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Job Summary
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Overview of your current and completed jobs
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {loadingStates.jobProgress ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="text-center">
                    <div className="h-8 w-20 mx-auto bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-16 mx-auto bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.jobProgress.inProgress}
                  </div>
                  <div className="text-sm text-gray-500">Jobs In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.jobProgress.completed}
                  </div>
                  <div className="text-sm text-gray-500">Jobs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dashboardData.jobProgress.totalEarnings)}
                  </div>
                  <div className="text-sm text-gray-500">Total Earnings</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Jobs with Progress */}
        {!loadingStates.jobProgress && dashboardData.jobProgress.currentJobs.length > 0 && (
          <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Current Jobs
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your in-progress jobs and their completion status
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.jobProgress.currentJobs.map((job) => (
                <div key={job.id} className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h4 className="text-base font-medium text-gray-900">{job.title}</h4>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {job.location?.city}, {job.location?.state}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Due by: {formatDate(job.expectedEndDate || new Date())}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="w-full md:w-48 mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{job.progress}% Complete</span>
                          <span className={job.progress >= 90 ? "text-red-600" : "text-gray-600"}>
                            {job.progress >= 90 && job.progress < 100 ? "Due soon" : ""}
                          </span>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${job.progress}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center 
                              ${job.progress < 30 ? 'bg-red-500' :
                                job.progress < 70 ? 'bg-yellow-500' :
                                  'bg-green-500'}`}>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="flex justify-center">
                <Link
                  href="/jobs/active"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View All Active Jobs
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Jobs
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingStates.jobs ? (
                          <span className="inline-block w-10 h-6 bg-gray-200 animate-pulse rounded"></span>
                        ) : (
                          dashboardData.availableJobs
                        )}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/jobs" className="font-medium text-blue-600 hover:text-blue-500">
                  Browse all jobs
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Your Applications
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingStates.applications ? (
                          <span className="inline-block w-10 h-6 bg-gray-200 animate-pulse rounded"></span>
                        ) : (
                          dashboardData.applications.total
                        )}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/applications" className="font-medium text-green-600 hover:text-green-500">
                  View all applications
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Credits
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingStates.profile ? (
                          <span className="inline-block w-10 h-6 bg-gray-200 animate-pulse rounded"></span>
                        ) : (
                          dashboardData.credits
                        )}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/credits" className="font-medium text-purple-600 hover:text-purple-500">
                  Purchase more credits
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Application status overview */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Application Status
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Overview of your current job applications
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {loadingStates.applications ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="text-center">
                    <div className="h-8 w-20 mx-auto bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-16 mx-auto bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {dashboardData.applications.pending}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {dashboardData.applications.shortlisted}
                  </div>
                  <div className="text-sm text-gray-500">Shortlisted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {dashboardData.applications.accepted}
                  </div>
                  <div className="text-sm text-gray-500">Accepted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">
                    {otherApplications}
                  </div>
                  <div className="text-sm text-gray-500">Other</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your latest activities and updates
              </p>
            </div>
            {!loadingStates.activity && dashboardData.recentActivity.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {dashboardData.recentActivity.length} updates
              </span>
            )}
          </div>
          <div className="bg-white overflow-hidden">
            {loadingStates.activity ? (
              <div className="px-4 py-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex space-x-3 mb-6">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                      <div className="h-6 w-full bg-gray-200 animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardData.recentActivity.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Your recent activities will appear here</p>
              </div>
            ) : (
              <div className="flow-root px-4 py-2">
                <ul className="-mb-8 max-h-96 overflow-y-auto">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <li key={activity.id || index}>
                      <div className="relative pb-8">
                        {index !== dashboardData.recentActivity.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.type === 'application' ? 'bg-blue-500' :
                                activity.type === 'job' ? 'bg-green-500' :
                                  activity.type === 'message' ? 'bg-yellow-500' :
                                    activity.type === 'credit' ? 'bg-purple-500' :
                                      activity.type === 'subscription' ? 'bg-indigo-500' :
                                        activity.type === 'payment' ? 'bg-emerald-500' :
                                          'bg-gray-500'
                              }`}>
                              {activity.type === 'application' && (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z" clipRule="evenodd" />
                                </svg>
                              )}
                              {activity.type === 'job' && (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                                </svg>
                              )}
                              {activity.type === 'message' && (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                </svg>
                              )}
                              {activity.type === 'credit' && (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                </svg>
                              )}
                              {activity.type === 'subscription' && (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zm2 7h4a2 2 0 002-2v-5h-6v7z" />
                                </svg>
                              )}
                              {activity.type === 'payment' && (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-gray-500 mb-0.5">
                              {formatDate(activity.date)}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <p className="text-sm font-medium text-gray-900">{activity.description}</p>

                              {/* Status badges for different activity types */}
                              {activity.status && activity.type === 'application' && (
                                <span className={`mt-1 sm:mt-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    activity.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                      activity.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                  }`}>
                                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </span>
                              )}

                              {/* Amount display for credit and payment activities */}
                              {(activity.type === 'credit' || activity.type === 'payment') && activity.amount !== undefined && (
                                <span className={`mt-1 sm:mt-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {activity.amount > 0 ? '+' : ''}{activity.amount} {activity.type === 'payment' ? '$' : 'credits'}
                                </span>
                              )}

                              {/* Subscription status badges */}
                              {activity.type === 'subscription' && activity.status && (
                                <span className={`mt-1 sm:mt-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.status === 'active' ? 'bg-green-100 text-green-800' :
                                    activity.status === 'canceled' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </span>
                              )}
                            </div>

                            {/* Action links for different activity types */}
                            {activity.link && (
                              <div className="mt-2">
                                <a href={activity.link} className="text-sm text-blue-600 hover:text-blue-500">
                                  {activity.type === 'application' ? 'View application' :
                                    activity.type === 'job' ? 'View job details' :
                                      activity.type === 'message' ? 'Read message' :
                                        'View details'}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Find Jobs
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Profile
          </Link>
          <Link
            href="/messages"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Messages
          </Link>
        </div>
      </div>
    </div>
  );
}