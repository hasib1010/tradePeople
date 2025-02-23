"use client"
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const statusParam = activeTab !== 'all' ? `?status=${activeTab}` : '';
        const response = await fetch(`/api/applications${statusParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to load applications');
        }
        
        const data = await response.json();
        setApplications(data.applications || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchApplications();
      
      // Update URL with status filter
      if (activeTab !== 'all') {
        router.push(`/applications?status=${activeTab}`, { scroll: false });
      } else {
        router.push('/applications', { scroll: false });
      }
    }
  }, [status, activeTab, router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
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

  const sortedApplications = [...applications].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    } else if (sortBy === 'jobTitle') {
      return a.job?.title.localeCompare(b.job?.title);
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
    router.push('/login?callbackUrl=/applications');
    return null;
  }

  const isCustomer = session?.user?.role === 'customer';
  const isTrader = session?.user?.role === 'tradesperson';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {isCustomer ? 'Received Applications' : 'Your Applications'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isCustomer 
              ? 'View and manage applications from tradespeople for your jobs'
              : 'Track the status of your job applications'}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
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
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`${
                      activeTab === 'pending'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Pending
                  </button>
                  {isCustomer && (
                    <button
                      onClick={() => setActiveTab('shortlisted')}
                      className={`${
                        activeTab === 'shortlisted'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Shortlisted
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('accepted')}
                    className={`${
                      activeTab === 'accepted'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Accepted
                  </button>
                  <button
                    onClick={() => setActiveTab('rejected')}
                    className={`${
                      activeTab === 'rejected'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Rejected
                  </button>
                  {isTrader && (
                    <button
                      onClick={() => setActiveTab('withdrawn')}
                      className={`${
                        activeTab === 'withdrawn'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Withdrawn
                    </button>
                  )}
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
                    <option value="jobTitle">Job Title</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications list */}
        {applications.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isCustomer 
                ? "You haven't received any applications matching this filter yet."
                : "You haven't applied to any jobs matching this filter yet."}
            </p>
            <div className="mt-6">
              {isCustomer ? (
                <Link
                  href="/jobs/post"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Post a New Job
                </Link>
              ) : (
                <Link
                  href="/jobs"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Browse Available Jobs
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul role="list" className="divide-y divide-gray-200">
              {sortedApplications.map((application) => (
                <li key={application._id} className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="flex-shrink-0">
                        {isCustomer ? (
                          // Show tradesperson image for customers
                          <img 
                            className="h-12 w-12 rounded-full" 
                            src={application.tradesperson?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                            alt="Applicant" 
                          />
                        ) : (
                          // Show job category icon for tradespeople
                          <div className="bg-blue-100 rounded-full p-3">
                            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {isCustomer 
                            ? `${application.tradesperson?.firstName} ${application.tradesperson?.lastName}`
                            : application.job?.title}
                        </h3>
                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(application.status)}`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Applied {formatDate(application.submittedAt)}
                          </div>
                          {isTrader && (
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {application.job?.location?.city}, {application.job?.location?.state}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col sm:items-end">
                      <div className="text-base font-medium text-gray-900 mb-2">
                        {application.bid?.type === 'negotiable' 
                          ? 'Negotiable' 
                          : formatCurrency(application.bid?.amount, application.bid?.currency)}
                        {application.bid?.type === 'hourly' && '/hour'}
                      </div>
                      <Link
                        href={`/applications/${application._id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                  
                  {/* Additional info for tradespeople */}
                  {isTrader && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-tight">Job Category</h4>
                        <p className="mt-1 text-sm text-gray-900">{application.job?.category}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-tight">Job Status</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {application.job?.status?.charAt(0).toUpperCase() + application.job?.status?.slice(1) || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional info for customers */}
                  {isCustomer && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-tight">Job</h4>
                        <p className="mt-1 text-sm text-gray-900">{application.job?.title}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-tight">Bid Type</h4>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{application.bid?.type}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-tight">Estimated Days</h4>
                        <p className="mt-1 text-sm text-gray-900">{application.bid?.estimatedDays || 'Not specified'}</p>
                      </div>
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