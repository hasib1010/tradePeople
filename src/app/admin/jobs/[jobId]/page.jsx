"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// AttachmentsSection component
const AttachmentsSection = ({ attachments }) => {
  console.log("Rendering AttachmentsSection with:", attachments);
  
  if (!attachments || attachments.length === 0) {
    console.log("No attachments to display");
    return (
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
          <p className="text-sm text-gray-500">No attachments available for this job.</p>
        </div>
      </div>
    );
  }

  // Function to determine icon based on file type
  const getFileIcon = (type) => {
    if (type?.includes('image')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (type?.includes('pdf')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (type?.includes('word') || type?.includes('doc')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Function to handle image preview
  const handlePreview = (attachment) => {
    if (attachment.type?.includes('image')) {
      window.open(attachment.url, '_blank');
    } else {
      // For non-image files, just download/open
      window.open(attachment.url, '_blank');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Attachments ({attachments.length})
        </h2>
        <ul className="divide-y divide-gray-200">
          {attachments.map((attachment, index) => (
            <li key={index} className="py-3 flex items-center hover:bg-gray-50 transition-colors rounded-md px-2">
              <div className="min-w-0 flex-1 flex items-center">
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.type || '')}
                </div>
                <div className="ml-4 truncate">
                  <div className="text-sm font-medium text-blue-600 truncate">
                    {attachment.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => handlePreview(attachment)}
                  className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {attachment.type?.includes('image') ? 'Preview' : 'Open'}
                </button>
                <a
                  href={attachment.url}
                  download
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

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
  const [previewImage, setPreviewImage] = useState(null);

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
      console.log("Fetched job data:", data.job);
      console.log("Attachments:", data.job.attachments);
      setJob(data.job);
      setCreditCost(data.job.creditCost || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (job && job.category && typeof job.category === 'string') {
      // If the category is an ID, fetch the category name directly
      if (job.category.match(/^[0-9a-fA-F]{24}$/)) {
        const fetchCategoryName = async () => {
          try {
            const response = await fetch(`/api/categories/${job.category}`);
            if (response.ok) {
              const data = await response.json();
              // Create a new job object with the categoryName
              setJob(prev => ({
                ...prev,
                categoryName: data.name
              }));
            }
          } catch (error) {
            console.error("Error fetching category:", error);
          }
        };
        fetchCategoryName();
      }
    }
  }, [job?.category]);

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
                <dd className="mt-1 text-sm text-gray-900">
                  {job.categoryName ||
                    (job.category && typeof job.category === 'object' && job.category.name) ||
                    (typeof job.category === 'string' && !job.category.match(/^[0-9a-fA-F]{24}$/) ?
                      job.category : 'Loading...')}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === "draft"
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

        {/* Attachments Section */}
        <AttachmentsSection attachments={job.attachments || []} />

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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setPreviewImage(null)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {previewImage.name}
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setPreviewImage(null)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex justify-center">
                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-h-[70vh] max-w-full object-contain"
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <a
                  href={previewImage.url}
                  download
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Download
                </a>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setPreviewImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}