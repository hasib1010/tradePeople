"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

// AttachmentsSection component for job details
const AttachmentsSection = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return null;
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

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((attachment, index) => (
          <li key={index} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
            <div className="flex-shrink-0">
              {getFileIcon(attachment.type || '')}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-600 truncate">{attachment.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
            </div>
            <div className="ml-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function MyJobsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login?callbackUrl=/my-jobs");
    },
  });

  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    // Redirect non-customers
    if (status === "authenticated" && session.user.role !== "customer") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch categories to display category names
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const categories = await response.json();
          const map = {};
          categories.forEach(cat => {
            map[cat._id] = cat.name;
          });
          setCategoryMap(map);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch jobs posted by the customer
  useEffect(() => {
    const fetchJobs = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/customer/jobs?userId=${session.user.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        
        const data = await response.json();
        console.log("Fetched jobs:", data.jobs);
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchJobs();
    }
  }, [session, status]);

  const filteredJobs = () => {
    if (filter === "all") return jobs;
    return jobs.filter(job => job.status === filter);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "open": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "canceled": return "bg-red-100 text-red-800";
      case "expired": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };

  const handleCloseDetails = () => {
    setSelectedJob(null);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Jobs</h1>
            <p className="mt-1 text-gray-500">
              Manage all your job postings in one place
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link 
              href="/jobs/post" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Post a New Job
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Filter by Status</h2>
          </div>
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-wrap space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "all"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All Jobs
              </button>
              <button
                onClick={() => setFilter("draft")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "draft"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Drafts
              </button>
              <button
                onClick={() => setFilter("open")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "open"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFilter("in-progress")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "completed"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter("canceled")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "canceled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Canceled
              </button>
            </div>
          </div>
        </div>

        {/* Job listings */}
        {filteredJobs().length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredJobs().map((job) => (
                <li key={job._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-blue-600 truncate">
                          {job.title}
                        </h3>
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(
                            job.status
                          )}`}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          <span className="font-medium">Category:</span>{" "}
                          {typeof job.category === 'object' && job.category?.name
                            ? job.category.name
                            : categoryMap[job.category] || "Uncategorized"}
                        </p>
                        <p className="ml-4 truncate">
                          <span className="font-medium">Posted:</span>{" "}
                          {formatDateTime(job.timeline?.postedDate || job.createdAt)}
                        </p>
                        <p className="ml-4 truncate">
                          <span className="font-medium">Applications:</span>{" "}
                          {job.applicationCount || job.applications?.length || 0}
                        </p>
                      </div>
                      {job.location && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          <span className="font-medium">Location:</span>{" "}
                          {job.location.city}, {job.location.state}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <button
                        onClick={() => handleViewDetails(job)}
                        className="mr-2 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      <Link
                        href={`/jobs/${job._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Manage Job
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all"
                ? "You haven't posted any jobs yet."
                : `You don't have any ${filter} jobs.`}
            </p>
            <div className="mt-6">
              <Link
                href="/jobs/post"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Post your first job
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseDetails}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {selectedJob.title}
                    </h3>
                    <div className="mt-2">
                      <div className="flex flex-wrap items-center mb-4 gap-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(selectedJob.status)}`}>
                          {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
                        </span>
                        {selectedJob.isUrgent && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          Posted on {formatDateTime(selectedJob.timeline?.postedDate || selectedJob.createdAt)}
                        </span>
                      </div>

                      {/* Job description */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedJob.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Category */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                          <p className="text-sm text-gray-600">
                            {typeof selectedJob.category === 'object' && selectedJob.category?.name
                              ? selectedJob.category.name
                              : categoryMap[selectedJob.category] || "Uncategorized"}
                          </p>
                        </div>

                        {/* Budget */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Budget</h4>
                          <p className="text-sm text-gray-600">
                            {selectedJob.budget?.type === "fixed"
                              ? `${selectedJob.budget.currency || "$"} ${selectedJob.budget.minAmount}`
                              : selectedJob.budget?.type === "range"
                                ? `${selectedJob.budget.currency || "$"} ${selectedJob.budget.minAmount} - ${selectedJob.budget.maxAmount}`
                                : "Negotiable"}
                          </p>
                        </div>

                        {/* Location */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                          <p className="text-sm text-gray-600">
                            {selectedJob.location?.address && `${selectedJob.location.address}, `}
                            {selectedJob.location?.city}, {selectedJob.location?.state} {selectedJob.location?.postalCode}
                          </p>
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                          <p className="text-sm text-gray-600">
                            {selectedJob.timeline?.startDate
                              ? `Starts: ${formatDateTime(selectedJob.timeline.startDate)}`
                              : "Start date not specified"}
                            {selectedJob.timeline?.endDate && `, Ends: ${formatDateTime(selectedJob.timeline.endDate)}`}
                          </p>
                          {selectedJob.timeline?.expectedDuration?.value && (
                            <p className="text-sm text-gray-600">
                              Duration: {selectedJob.timeline.expectedDuration.value} {selectedJob.timeline.expectedDuration.unit}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Attachments */}
                      {selectedJob.attachments && selectedJob.attachments.length > 0 && (
                        <div className="mb-4">
                          <AttachmentsSection attachments={selectedJob.attachments} />
                        </div>
                      )}

                      {/* Applications count */}
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Applications</h4>
                        <p className="text-sm text-gray-600">
                          This job has received {selectedJob.applicationCount || selectedJob.applications?.length || 0} application(s).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Link
                  href={`/jobs/${selectedJob._id}`}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Manage Job
                </Link>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseDetails}
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