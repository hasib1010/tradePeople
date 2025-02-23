"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/login?callbackUrl=/dashboard/admin");
        },
    });

    // Check if user is admin
    useEffect(() => {
        if (status === "authenticated" && session?.user?.role !== "admin") {
            redirect(`/dashboard/${session?.user?.role || ""}`);
        }
    }, [status, session]);

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTradespeople: 0,
        totalCustomers: 0,
        activeJobs: 0,
        pendingVerifications: 0,
        totalCredits: 0,
        totalRevenue: 0
    });

    const [recentUsers, setRecentUsers] = useState([]);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch admin dashboard data
        if (status === "authenticated" && session?.user?.role === "admin") {
            const fetchDashboardData = async () => {
                try {
                    // Fetch dashboard stats
                    const statsResponse = await fetch('/api/admin/dashboard/stats');

                    if (!statsResponse.ok) {
                        throw new Error('Failed to fetch dashboard stats');
                    }

                    const statsData = await statsResponse.json();
                    setStats(statsData);

                    // Fetch recent users
                    const usersResponse = await fetch('/api/admin/users/recent');

                    if (!usersResponse.ok) {
                        throw new Error('Failed to fetch recent users');
                    }

                    const usersData = await usersResponse.json();
                    setRecentUsers(usersData);

                    // Fetch recent jobs
                    const jobsResponse = await fetch('/api/admin/jobs/recent');

                    if (!jobsResponse.ok) {
                        throw new Error('Failed to fetch recent jobs');
                    }

                    const jobsData = await jobsResponse.json();
                    setRecentJobs(jobsData);

                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                    setLoading(false);
                }
            };

            fetchDashboardData();
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
                {/* Admin Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage users, jobs, and platform settings
                    </p>
                </div>

                {/* Stats Overview Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Users
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{stats.totalUsers}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                            <div className="mt-2 flex justify-between text-sm">
                                <div className="text-green-600">
                                    <span className="font-medium">{stats.totalTradespeople}</span> tradespeople
                                </div>
                                <div className="text-blue-600">
                                    <span className="font-medium">{stats.totalCustomers}</span> customers
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <Link href="/admin/users" className="font-medium text-blue-600 hover:text-blue-500">
                                    Manage users
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Active Jobs
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
                                <Link href="/admin/jobs" className="font-medium text-green-600 hover:text-green-500">
                                    View all jobs
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Pending Verifications
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{stats.pendingVerifications}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <Link href="/admin/verifications" className="font-medium text-yellow-600 hover:text-yellow-500">
                                    Verify credentials
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Revenue
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">${stats.totalRevenue}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                <span className="font-medium text-gray-700">{stats.totalCredits}</span> credits in circulation
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <Link href="/admin/finance" className="font-medium text-purple-600 hover:text-purple-500">
                                    View financials
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Recent Users Panel */}
                    <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Users</h3>
                            <Link href="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                View all
                            </Link>
                        </div>
                        <div className="bg-white px-4 py-5 sm:p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Edit</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            {user.profileImage ? (
                                                                <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full" />
                                                            ) : (
                                                                <span className="text-gray-600 font-medium">
                                                                    {user.firstName?.charAt(0) || user.name?.charAt(0) || 'U'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'tradesperson'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : user.role === 'customer'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {user.role === 'tradesperson' ? 'Tradesperson' :
                                                            user.role === 'customer' ? 'Customer' : 'Admin'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {!user.isVerified && (
                                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Unverified
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-900">
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Panel */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Admin Actions</h3>
                            <ul className="divide-y divide-gray-200">
                                <li className="py-4">
                                    <Link href="/dashboard/admin/subscription-plans" className="group flex items-center">
                                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md group-hover:bg-indigo-200">
                                            <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </span>
                                        <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                                            Manage Subscription Plans
                                        </span>
                                    </Link>
                                </li>
                                <li className="py-4">
                                    <Link href="/admin/create-user" className="group flex items-center">
                                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md group-hover:bg-blue-200">
                                            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                        </span>
                                        <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                                            Create User
                                        </span>
                                    </Link>
                                </li>
                                <li className="py-4">
                                    <Link href="/admin/verifications" className="group flex items-center">
                                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-green-100 rounded-md group-hover:bg-green-200">
                                            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </span>
                                        <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                                            Verify Credentials
                                        </span>
                                    </Link>
                                </li>
                                <li className="py-4">
                                    <Link href="/admin/jobs/manage" className="group flex items-center">
                                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-yellow-100 rounded-md group-hover:bg-yellow-200">
                                            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        </span>
                                        <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                                            Manage Jobs
                                        </span>
                                    </Link>
                                </li>
                                <li className="py-4">
                                    <Link href="/admin/settings" className="group flex items-center">
                                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 rounded-md group-hover:bg-purple-200">
                                            <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </span>
                                        <span className="ml-4 text-base font-medium text-gray-900 group-hover:text-gray-700">
                                            Platform Settings
                                        </span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Recent Jobs Panel */}
                <div className="mt-8">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Jobs</h3>
                            <Link href="/admin/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                View all jobs
                            </Link>
                        </div>
                        <div className="bg-white px-4 py-5 sm:p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Job Title
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Posted
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Edit</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentJobs.map((job) => (
                                            <tr key={job.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                                    <div className="text-sm text-gray-500">{job.applicationCount} applications</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{job.customerName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{job.category}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(job.postedDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-800' :
                                                            job.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                job.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                    job.status === 'canceled' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {job.status === 'open' ? 'Open' :
                                                            job.status === 'in-progress' ? 'In Progress' :
                                                                job.status === 'completed' ? 'Completed' :
                                                                    job.status === 'canceled' ? 'Canceled' :
                                                                        job.status === 'expired' ? 'Expired' :
                                                                            job.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={`/admin/jobs/${job.id}`} className="text-blue-600 hover:text-blue-900">
                                                        Manage
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}