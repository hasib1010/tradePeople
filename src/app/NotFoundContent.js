"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NotFoundContent() {
  const searchParams = useSearchParams();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-gray-800">404</h1>
          <p className="mt-4 text-xl text-gray-600">Page Not Found</p>
          <p className="mt-2 text-gray-500">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Go to Home
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}