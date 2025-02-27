"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function AdminJobDetails() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/admin/jobs");
    },
  });

  const router = useRouter();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creditCost, setCreditCost] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchJob();
    }
  }, [status, session, jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      setJob(data.job);
      setCreditCost(data.job.creditCost || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setError("");
      setSuccess("");
      const response = await fetch(`/api/admin/jobs/${jobId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creditCost: Number(creditCost) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve job");
      }

      const data = await response.json();
      setSuccess(data.message);
      await fetchJob(); // Refresh job data
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setError("");
      setSuccess("");
      const response = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job status");
      }

      const data = await response.json();
      setSuccess(data.message);
      await fetchJob(); // Refresh job data
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600">Job not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Job ID: {job._id} | Posted: {new Date(job.timeline.postedDate).toLocaleDateString()}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Job Details */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Details</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.customer.firstName} {job.customer.lastName} ({job.customer.email})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.category}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      job.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : job.status === "open"
                        ? "bg-green-100 text-green-800"
                        : job.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : job.status === "completed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Credit Cost</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.status === "draft" ? (
                    <input
                      type="number"
                      min="1"
                      value={creditCost}
                      onChange={(e) => setCreditCost(e.target.value)}
                      className="w-20 px-2 py-1 border rounded-md"
                    />
                  ) : (
                    job.creditCost || "Not set"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Budget</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.budget.type === "fixed"
                    ? `${job.budget.currency} ${job.budget.minAmount}`
                    : job.budget.type === "range"
                    ? `${job.budget.currency} ${job.budget.minAmount} - ${job.budget.maxAmount}`
                    : "Negotiable"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Urgent</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.isUrgent ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
            <p className="text-sm text-gray-900">
              {job.location.address}, {job.location.city}, {job.location.state}{" "}
              {job.location.postalCode}, {job.location.country}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Posted Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.timeline.postedDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.timeline.startDate
                    ? new Date(job.timeline.startDate).toLocaleDateString()
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.timeline.endDate
                    ? new Date(job.timeline.endDate).toLocaleDateString()
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Expected Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.timeline.expectedDuration.value
                    ? `${job.timeline.expectedDuration.value} ${job.timeline.expectedDuration.unit}`
                    : "Not specified"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h2>
            <div className="space-y-4">
              {job.status === "draft" && (
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Approve Job
                </button>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Status
                </label>
                <select
                  onChange={(e) => handleStatusChange(e.target.value)}
                  value={job.status}
                  className="block w-48 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <Link
                href="/admin/jobs"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Jobs List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}