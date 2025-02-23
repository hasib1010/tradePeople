"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  FileText, 
  Upload, 
  AlertTriangle 
} from 'lucide-react';

export default function ProfileVerificationPage() {
  const { data: session, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login?callbackUrl=/profile/verification');
    },
  });

  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    isLoading: true,
    error: null
  });

  // Check and update verification status
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (status !== "authenticated" || session?.user?.role !== 'tradesperson') {
        return;
      }

      try {
        setVerificationStatus(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch('/api/profile/verification-status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch verification status');
        }
        
        const data = await response.json();
        
        // Update local state
        setVerificationStatus({
          isVerified: data.isVerified,
          isLoading: false,
          error: null
        });
        
        // If session verification status is different from current status,
        // update the session to refresh the JWT token
        if (data.isVerified !== session.user.isVerified) {
          await update({
            ...session,
            user: {
              ...session.user,
              isVerified: data.isVerified
            }
          });
        }
        
      } catch (error) {
        console.error('Error checking verification status:', error);
        setVerificationStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to check verification status'
        }));
      }
    };
    
    checkVerificationStatus();
  }, [status, session, update]);

  // Redirect non-tradesperson users
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "tradesperson") {
      redirect(`/dashboard/${session?.user?.role}`);
    }
  }, [status, session]);

  // Loading state
  if (status === "loading" || verificationStatus.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Account Verification Status</h1>
          <p className="mt-2 text-lg text-gray-600">
            Your verification status determines your ability to apply for jobs
          </p>
        </div>
        
        {/* Error message */}
        {verificationStatus.error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{verificationStatus.error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Verification status card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Verification Status</h2>
              <p className="text-sm text-gray-600">Your current account verification status</p>
            </div>
            <div>
              {verificationStatus.isVerified ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="mr-1.5 h-4 w-4" />
                  Pending
                </span>
              )}
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {verificationStatus.isVerified ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Your Account is Verified</h3>
                <p className="mt-2 text-gray-600">
                  Congratulations! Your account has been verified by our administrators.
                  You can now apply for jobs on the platform.
                </p>
                <div className="mt-6">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Jobs
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Verification In Progress</h3>
                <p className="mt-2 text-gray-600">
                  Your account is currently pending verification by our administrators.
                  Please ensure you've uploaded all required documents to speed up this process.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900">Verification Requirements</h4>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-start">
                        <span className="h-5 w-5 text-blue-500 mr-2">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="text-sm text-gray-600">
                          Valid business or trade license (if applicable)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="h-5 w-5 text-blue-500 mr-2">
                          <Shield className="h-5 w-5" />
                        </span>
                        <span className="text-sm text-gray-600">
                          Professional certification or qualifications
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="h-5 w-5 text-blue-500 mr-2">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="text-sm text-gray-600">
                          Insurance documentation (if applicable)
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Complete Your Profile
                    </Link>
                    <Link
                      href="/profile/documents"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload className="mr-1.5 h-4 w-4" />
                      Upload Documents
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
            <div className="text-sm">
              <p className="text-gray-600">
                Need help with verification? 
                <Link href="/contact" className="ml-1 font-medium text-blue-600 hover:text-blue-500">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional information */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Why Verification Matters</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="prose prose-sm text-gray-600 max-w-none">
                <p>
                  Account verification helps ensure the quality and credibility of all tradespeople on our platform. 
                  Our verification process checks:
                </p>
                <ul>
                  <li>Professional qualifications and certifications</li>
                  <li>Business license validity (where applicable)</li>
                  <li>Insurance coverage</li>
                  <li>Identity verification</li>
                </ul>
                <p>
                  Once verified, your profile will display a verification badge, increasing customer trust 
                  and improving your chances of winning jobs.
                </p>
                <p>
                  Verification typically takes 1-3 business days after all required documents have been submitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}