// src/app/dashboard/tradesperson/page.js
"use client"
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function TradespersonDashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/dashboard/tradesperson");
    },
  });

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Tradesperson Dashboard</h1>
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold">Welcome, {session.user.name}!</h2>
        <p className="mt-2">You have successfully logged in as a tradesperson.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Available Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
          <p className="text-sm text-gray-600">Jobs matching your skills</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Browse Jobs
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Your Applications</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
          <p className="text-sm text-gray-600">Active job applications</p>
          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
            View Applications
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Credits</h3>
          <p className="text-3xl font-bold text-purple-600">5</p>
          <p className="text-sm text-gray-600">Available to use</p>
          <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full">
            Buy More Credits
          </button>
        </div>
      </div>
    </div>
  );
}