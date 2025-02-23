"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function JobApplicationsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    // First fetch the job details
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Job not found');
          }
          throw new Error('Failed to load job details');
        }
        
        const jobData = await response.json();
        setJob(jobData);
        
        // Now fetch the applications
        await fetchApplications();
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    // Function to fetch applications
    const fetchApplications = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}/applications`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Job not found');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view these applications');
          }
          throw new Error('Failed to load applications');
        }
        
        const data = await response.json();
        setApplications(data.applications);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchJobDetails();
    }
  }, [id, status]);

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }
      
      const data = await response.json();
      
      // Update the application status in the local state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    } else if (sortBy === 'highestBid') {
      return (b.bid?.amount || 0) - (a.bid?.amount || 0);
    } else if (sortBy === 'lowestBid') {
      return (a.bid?.amount || 0) - (b.bid?.amount || 0);
    }
    return 0;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push(`/login?callbackUrl=/jobs/${id}/applications`);
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Error
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                {error}
              </p>
              <div className="mt-6">
                <Link href="/dashboard" className="text-base font-medium text-blue-600 hover:text-blue-500">
                  Go to Dashboard
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <Link
              href={`/jobs/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Job Details
            </Link>
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Applications for {job.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {applications.length} applications received
          </p>
        </div>

        {/* Controls - tabs and sorting */}
        <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
              {/* Filter tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`${
                      activeTab === 'all'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    All ({applications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`${
                      activeTab === 'pending'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Pending ({applications.filter(app => app.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('shortlisted')}
                    className={`${
                      activeTab === 'shortlisted'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Shortlisted ({applications.filter(app => app.status === 'shortlisted').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('accepted')}
                    className={`${
                      activeTab === 'accepted'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Accepted ({applications.filter(app => app.status === 'accepted').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('rejected')}
                    className={`${
                      activeTab === 'rejected'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Rejected ({applications.filter(app => app.status === 'rejected').length})
                  </button>
                </nav>
              </div>

              {/* Sort options */}
              <div className="mt-4 sm:mt-0">
                <label htmlFor="sort" className="sr-only">Sort by</label>
                <div className="relative">
                  <select
                    id="sort"
                    name="sort"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highestBid">Highest Bid</option>
                    <option value="lowestBid">Lowest Bid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications list */}
        {sortedApplications.length === 0 ? (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' 
                ? "This job hasn't received any applications yet."
                : `No applications with status "${activeTab}" found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul role="list" className="divide-y divide-gray-200">
              {sortedApplications.map((application) => (
                <li key={application._id} className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img 
                          className="h-12 w-12 rounded-full" 
                          src={application.tradesperson?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                          alt="Applicant" 
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.tradesperson?.firstName} {application.tradesperson?.lastName}
                        </h3>
                        <div className="mt-1 flex items-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            Applied {formatDate(application.submittedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-medium text-gray-900">
                          {application.bid.type === 'negotiable' 
                            ? 'Negotiable' 
                            : `${application.bid.currency} ${application.bid.amount}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.bid.type === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/applications/${application._id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick actions - only show for pending applications */}
                  {application.status === 'pending' && (
                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'shortlisted')}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'accepted')}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'rejected')}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {/* Quick actions - shortlisted applications */}
                  {application.status === 'shortlisted' && (
                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'accepted')}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'rejected')}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'pending')}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Move to Pending
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}