// src/app/dashboard/customer/page.js
"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function CustomerDashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/dashboard/customer");
    },
  });

  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    ongoingProjects: 0,
    savedTradespeople: 0
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch customer dashboard data
    if (status === "authenticated" && session?.user) {
      // This would be a real API call in production
      // Simulate loading dashboard data
      setTimeout(() => {
        setStats({
          activeJobs: 2,
          completedJobs: 5,
          ongoingProjects: 1,
          savedTradespeople: 3
        });
        
        setRecentJobs([
          {
            id: 'job1',
            title: 'Bathroom Renovation',
            status: 'in-progress',
            applications: 4,
            posted: '2025-02-10',
            category: 'Plumbing'
          },
          {
            id: 'job2',
            title: 'Kitchen Cabinet Installation',
            status: 'open',
            applications: 2,
            posted: '2025-02-15',
            category: 'Carpentry'
          }
        ]);
        
        setLoading(false);
      }, 1000);
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your projects and find qualified tradespeople for your home improvement needs.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Job Postings
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.activeJobs}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link href="/jobs" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all job postings
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Projects
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.completedJobs}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link href="/completed-jobs" className="font-medium text-green-600 hover:text-green-500">
                  View project history
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ongoing Projects
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.ongoingProjects}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link href="/ongoing-projects" className="font-medium text-yellow-600 hover:text-yellow-500">
                  Check project status
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Saved Tradespeople
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.savedTradespeople}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link href="/favorites" className="font-medium text-red-600 hover:text-red-500">
                  View saved professionals
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Recent Job Postings */}
          <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
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
                            <span className={`inline-flex items-center justify-center h-12 w-12 rounded-md ${
                              job.status === 'open' ? 'bg-blue-100' : 
                              job.status === 'in-progress' ? 'bg-yellow-100' : 'bg-green-100'
                            }`}>
                              <svg className={`h-6 w-6 ${
                                job.status === 'open' ? 'text-blue-600' : 
                                job.status === 'in-progress' ? 'text-yellow-600' : 'text-green-600'
                              }`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {job.title}
                            </p>
                            <div className="mt-1 flex items-center">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                job.status === 'open' ? 'bg-blue-100 text-blue-800' : 
                                job.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {job.status === 'open' ? 'Open' : 
                                 job.status === 'in-progress' ? 'In Progress' : 'Completed'}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">{job.applications} applications</span>
                              <span className="mx-1 text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{job.category}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              Posted on {new Date(job.posted).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Link href={`/jobs/${job.id}`} className="inline-flex items-center shadow-sm px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                              View
                            </Link>
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
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new job posting.</p>
                  <div className="mt-6">
                    <Link
                      href="/jobs/post"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Job
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {recentJobs.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                <Link href="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View all job postings
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <ul className="divide-y divide-gray-200">
                <li className="py-4">
                  <Link href="/jobs/post" className="group flex items-center">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </span>
                    <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                      Post New Job
                    </span>
                  </Link>
                </li>
                <li className="py-4">
                  <Link href="/tradespeople" className="group flex items-center">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                      Find Tradespeople
                    </span>
                  </Link>
                </li>
                <li className="py-4">
                  <Link href="/messages" className="group flex items-center">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </span>
                    <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                      Messages
                    </span>
                  </Link>
                </li>
                <li className="py-4">
                  <Link href="/profile" className="group flex items-center">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                      Edit Profile
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}