// src/app/jobs/page.js
"use client"
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1
  });
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
    search: searchParams.get("search") || "",
    page: parseInt(searchParams.get("page") || "1")
  });

  const categories = [
    'All Categories',
    'Plumbing', 'Electrical', 'Carpentry', 'Painting',
    'Roofing', 'HVAC', 'Landscaping', 'Masonry',
    'Flooring', 'Tiling', 'General Contracting', 'Drywall'
  ];

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All Categories') {
        params.append('category', filters.category);
      }
      if (filters.city) {
        params.append('city', filters.city);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('page', filters.page.toString());
      params.append('limit', '10');
      
      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setJobs(data.jobs);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch jobs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 1 // Reset to first page on filter change
    });
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set(name, value);
    params.set('page', '1');
    router.replace(`/jobs?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage
    });
    
    // Update URL param
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.replace(`/jobs?${params.toString()}`);
  };

  const formatBudget = (budget) => {
    if (!budget) return 'Budget negotiable';
    
    const { type, minAmount, maxAmount, currency } = budget;
    
    if (type === 'negotiable') return 'Budget negotiable';
    if (type === 'fixed') return `${currency}${minAmount}`;
    
    if (minAmount && maxAmount) {
      return `${currency}${minAmount} - ${currency}${maxAmount}`;
    } else if (minAmount) {
      return `From ${currency}${minAmount}`;
    } else if (maxAmount) {
      return `Up to ${currency}${maxAmount}`;
    }
    
    return 'Budget negotiable';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Find Jobs
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Browse available jobs and find your next project
          </p>
        </div>

        {/* Filters */}
        <div className="mt-10 bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="search"
                  id="search"
                  placeholder="Search job titles or descriptions"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full py-2 px-4 border block "
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="shadow-sm py-[10px] px-4 border w-full block"
                >
                  {categories.map((category) => (
                    <option key={category} value={category === 'All Categories' ? '' : category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  placeholder="Enter city name"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="shadow-sm py-2 px-4 block border w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <li key={job._id} className="shadow-md">
                    <Link href={`/jobs/${job._id}`} className="block hover:bg-blue-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <span className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                job.isUrgent ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                                {job.isUrgent ? (
                                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-blue-600">
                                {job.title}
                                {job.isUrgent && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                <span>{job.category}</span>
                                <span className="mx-1">•</span>
                                <span>{job.location?.city}, {job.location?.state}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {formatBudget(job.budget)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2  sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex  items-center text-sm text-gray-500">
                              <span>des: {job.description?.substring(0, 100)}...</span>
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <p>
                              Posted {new Date(job.timeline?.postedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="flex items-center">
                            {job.customer.profileImage ? (
                              <Image
                                className="h-6 w-6 rounded-full"
                                src={job.customer.profileImage}
                                alt=""
                                width={24}
                                height={24}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  {job.customer.firstName?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="ml-2 text-sm font-medium text-gray-600">
                              By {job.customer.firstName} {job.customer.lastName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="bg-green-600 px-1 rounded-full text-white">{job.applicationCount || 0}</span> applications
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <nav
                  className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
                  aria-label="Pagination"
                >
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * 10 + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(pagination.page * 10, pagination.total)}
                      </span>{" "}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div className="flex-1 flex justify-between sm:justify-end">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </nav>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search filters or check back later for new listings.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setFilters({
                      category: "",
                      city: "",
                      search: "",
                      page: 1
                    });
                    router.push('/jobs');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}