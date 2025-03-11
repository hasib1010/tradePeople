"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
    } else if (type?.includes('word') || type?.includes('doc')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else if (type?.includes('sheet') || type?.includes('excel') || type?.includes('xls')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm9 8H6V7h8v5z" clipRule="evenodd" />
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
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attachments ({attachments.length})
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Files and documents related to this job
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {attachments.map((attachment, index) => (
            <li key={index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
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
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push(`/login?callbackUrl=/jobs/${id}`);
    },
  });

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobDetails();
    }
  }, [id, status, session]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      // Fetch categories first to have them available for lookup
      const categoriesResponse = await fetch('/api/categories');
      let categoriesMap = {};

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (Array.isArray(categoriesData)) {
          // Create a map of category ID to category name
          categoriesData.forEach(category => {
            if (category._id) {
              categoriesMap[category._id] = category.name || 'Unknown';
            }
          });
        }
      }

      // Now fetch the job
      const jobResponse = await fetch(`/api/jobs/${id}`);
      if (!jobResponse.ok) throw new Error("Failed to load job details");
      const jobData = await jobResponse.json();

      // Look up the category name if it's an ID
      let categoryName = "Uncategorized";
      if (typeof jobData.category === 'string' && /^[0-9a-fA-F]{24}$/.test(jobData.category)) {
        categoryName = categoriesMap[jobData.category] || "Unknown Category";
      } else if (typeof jobData.category === 'object' && jobData.category !== null) {
        if (jobData.category.name) {
          categoryName = jobData.category.name;
        } else if (jobData.category._id && categoriesMap[jobData.category._id]) {
          categoryName = categoriesMap[jobData.category._id];
        }
      }

      // Add the category name to the job object
      const processedJob = {
        ...jobData,
        categoryName: categoryName
      };

      setJob(processedJob);

      // Fetch applications based on user role
      if (jobData.customer._id === session.user.id) {
        const applicationsResponse = await fetch(`/api/jobs/${id}/applications`);
        if (!applicationsResponse.ok) throw new Error("Failed to load applications");
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData.applications);
      } else if (session.user.role === "tradesperson") {
        const applicationsResponse = await fetch(`/api/jobs/${id}/applications`);
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setApplications(applicationsData.applications.filter(app => app.tradesperson._id === session.user.id));
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Helper function to extract category name properly
  const getCategoryName = (category) => {
    if (!category) return "Uncategorized";

    // If it's a string, return it directly
    if (typeof category === 'string') {
      return category;
    }

    // If it's an object with a name property (common case)
    if (typeof category === 'object' && category !== null) {
      if (category.name) {
        return category.name;
      }
      // If there's no name property but there's a toString method
      if (category.toString && typeof category.toString === 'function') {
        const stringValue = category.toString();
        // Make sure it's not just the default Object.prototype.toString output
        if (stringValue !== '[object Object]') {
          return stringValue;
        }
      }
    }

    return "Uncategorized";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "shortlisted": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "withdrawn": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAcceptApplication = async (applicationId) => {
    try {
      const response = await fetch(`/api/jobs/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      if (!response.ok) throw new Error("Failed to accept application");

      const data = await response.json();
      setJob((prev) => ({ ...prev, status: "in-progress", selectedTradesperson: data.job.selectedTradesperson }));
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId
            ? { ...app, status: "accepted" }
            : { ...app, status: app.status === "pending" ? "rejected" : app.status }
        )
      );
      alert("Application accepted! Job is now in progress.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerFeedback: "Work completed satisfactorily.",
          finalAmount: job.budget?.minAmount || 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete job");

      const data = await response.json();
      setJob((prev) => ({ ...prev, status: "completed" }));
      alert("Job marked as completed! Please leave a review.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApply = async () => {
    if (session.user.role !== "tradesperson") {
      alert("Only tradespeople can apply for jobs.");
      return;
    }
    router.push(`/jobs/${id}/apply`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Error Loading Job</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => fetchJobDetails()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isOwner = session?.user?.id === job.customer._id;
  const hasApplied = applications.some(app => app.tradesperson?._id === session.user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Posted on {formatDate(job.timeline?.postedDate || job.createdAt)}</p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === "open"
                    ? "bg-blue-100 text-blue-800"
                    : job.status === "in-progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : job.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : job.status === "canceled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
                <span className="ml-2 text-sm text-gray-500">{applications.length} applications</span>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex space-x-3">
              {isOwner ? (
                <>
                  {job.status === "open" && (
                    <>
                      <Link
                        href={`/jobs/${id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit Job
                      </Link>
                      <button
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                          if (confirm("Are you sure you want to close this job?")) {
                            await fetch(`/api/jobs/${id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "canceled" }),
                            });
                            setJob((prev) => ({ ...prev, status: "canceled" }));
                          }
                        }}
                      >
                        Close Job
                      </button>
                    </>
                  )}
                  {job.status === "in-progress" && (
                    <button
                      onClick={handleCompleteJob}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Complete Job
                    </button>
                  )}
                </>
              ) : (
                session.user.role === "tradesperson" && job.status === "open" && !hasApplied && (
                  <button
                    onClick={handleApply}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Apply for this Job
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${activeTab === "details" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab("details")}
            >
              Job Details
            </button>
            {(isOwner || (session.user.role === "tradesperson" && hasApplied)) && (
              <button
                className={`${activeTab === "applications" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab("applications")}
              >
                Applications ({applications.length})
              </button>
            )}
          </nav>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column */}
          <div className="lg:col-span-8">
            {activeTab === "details" ? (
              <>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">Job Description</h2>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <p className="text-gray-800 whitespace-pre-wrap">{job.description}</p>
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h3 className="text-md font-medium text-gray-900">Job Details</h3>
                      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Category</dt>
                          <dd className="mt-1 text-sm text-gray-900">{job.categoryName || getCategoryName(job.category) || "Uncategorized"}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {job.location?.city ? job.location.city : ""}
                            {job.location?.city && job.location?.state ? ", " : ""}
                            {job.location?.state ? job.location.state : ""}
                            {job.location?.postalCode ? job.location.postalCode : ""}
                            {!job.location?.city && !job.location?.state && !job.location?.postalCode && "Location not specified"}
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Budget</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {job.budget?.type === "fixed"
                              ? `${job.budget.currency || "$"} ${job.budget.minAmount}`
                              : job.budget?.type === "range"
                                ? `${job.budget.currency || "$"} ${job.budget.minAmount} - ${job.budget.maxAmount}`
                                : "Negotiable"}
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {job.timeline?.startDate
                              ? `Starts ${formatDate(job.timeline.startDate)}`
                              : "Flexible start date"}
                            {job.timeline?.endDate && ` - Ends ${formatDate(job.timeline.endDate)}`}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                {job.attachments && job.attachments.length > 0 && (
                  <AttachmentsSection attachments={job.attachments} />
                )}
              </>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Applications</h2>
                </div>
                {applications.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {applications.map((application) => (
                      <li key={application._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <img
                                className="h-12 w-12 rounded-full"
                                src={application.tradesperson?.profileImage || "https://i.ibb.co/HfL0Fr7P/default-profile.jpg"}
                                alt={application.tradesperson?.firstName}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.tradesperson?.firstName} {application.tradesperson?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.tradesperson?.businessName && `${application.tradesperson.businessName} • `}
                                {application.tradesperson?.skills?.slice(0, 2).join(", ")}
                                {application.tradesperson?.skills?.length > 2 && ", ..."}
                              </div>
                              <div className="mt-1 flex items-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(application.status)}`}>
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  Applied on {formatDate(application.submittedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:space-x-2">
                            <Link
                              href={`/applications/${application._id}`}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              View Details
                            </Link>
                            {isOwner && job.status === "open" && application.status === "pending" && (
                              <button
                                onClick={() => handleAcceptApplication(application._id)}
                                className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 border border-yellow-300 text-sm leading-5 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                              >
                                Accept
                              </button>
                            )}
                            <Link
                              href={`/messages/application/${application._id}`}
                              className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 border border-blue-700 text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                              </svg>
                              Message
                            </Link>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-900 font-medium">Bid:</div>
                          <div className="text-sm text-gray-500">
                            {application.bid?.type === "fixed" && `Fixed Price: ${application.bid.currency || "$"} ${application.bid.amount}`}
                            {application.bid?.type === "hourly" && `Hourly Rate: ${application.bid.currency || "$"} ${application.bid.amount}/hr`}
                            {application.bid?.type === "negotiable" && "Negotiable"}
                            {application.bid?.estimatedDays && ` • Estimated Duration: ${application.bid.estimatedDays} days`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Your job posting has not received any applications yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-4">
            <div className="lg:col-span-4">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {isOwner ? "Posted by You" : "Customer Information"}
                </h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {/* Show full customer info for: 1) the owner 2) admins 3) tradespeople who applied */}
                {(isOwner || session?.user?.role === "admin" || hasApplied) ? (
                  <div className="flex flex-col items-center">
                    <img
                      className="h-24 w-24 rounded-full"
                      src={job.customer?.profileImage || "https://i.ibb.co/HfL0Fr7P/default-profile.jpg"}
                      alt={job.customer?.firstName || "User Profile"}
                    />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {job.customer?.firstName} {job.customer?.lastName}
                    </h3>
                    {!isOwner && hasApplied && (
                      <div className="mt-2 text-center">
                        <p className="text-sm text-gray-600">{job.customer?.email}</p>
                        {job.customer?.phoneNumber && (
                          <p className="text-sm text-gray-600">{job.customer?.phoneNumber}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show limited info with privacy notice for tradespeople who haven't applied */
                  <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Customer Information</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Apply for this job to view the customer's details
                    </p>

                    {session?.user?.role === "tradesperson" && job.status === "open" && (
                      <button
                        onClick={handleApply}
                        className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Apply for this Job
                      </button>
                    )}
                  </div>
                )}

                {/* Common actions section */}
                {!isOwner && (
                  <div className="mt-4 w-full">
                    <Link href="/jobs" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      Browse More Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <ul className="space-y-3">
                  {isOwner ? (
                    <>
                      {job.status === "open" && (
                        <li>
                          <Link href={`/jobs/${id}/edit`} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Edit Job Posting
                          </Link>
                        </li>
                      )}
                      <li>
                        <Link href="/jobs" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                          <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                          </svg>
                          View All Your Jobs
                        </Link>
                      </li>
                       
                      <li>
                        <Link href="/messages" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                          <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                          Messages
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link href="/my-jobs" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                          <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 001-2-2V5a2 2 0 01-2-2h-4z" />
                          </svg>
                          Browse More Jobs
                        </Link>
                      </li>
                      <li>
                        <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                          <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          Save Job
                        </button>
                      </li>
                      <li>
                        <Link href={session.user.role === "tradesperson" ? "/dashboard/tradesperson" : "/dashboard/customer"} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                          <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                          Go to Dashboard
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}