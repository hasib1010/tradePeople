"use client"
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login?callbackUrl=/credits/confirmation');
    },
  });

  const [state, setState] = useState({
    loading: true,
    success: false,
    error: null,
    credits: 0
  });

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment intent ID from URL
        const paymentIntentId = searchParams.get('payment_intent');
        const redirectStatus = searchParams.get('redirect_status');

        if (!paymentIntentId) {
          throw new Error('No payment information found');
        }

        if (redirectStatus === 'failed') {
          throw new Error('Payment failed. Please try again.');
        }

        // Verify with our backend
        const response = await fetch('/api/credits/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        // Payment successful
        setState({
          loading: false,
          success: true,
          error: null,
          credits: data.credits || 0
        });
      } catch (error) {
        console.error('Payment verification error:', error);
        setState({
          loading: false,
          success: false,
          error: error.message || 'Failed to verify payment'
        });
      }
    };

    if (status === 'authenticated') {
      verifyPayment();
    }
  }, [searchParams, status, router]);

  if (status === 'loading' || state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin mb-4">
          <Loader size={48} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Verifying your payment...</h2>
        <p className="mt-2 text-gray-600">Please wait while we confirm your credit purchase.</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <XCircle size={64} className="mx-auto text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Failed</h2>
            <p className="mt-2 text-gray-600">{state.error}</p>
            <div className="mt-6">
              <Link
                href="/credits"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft size={16} className="mr-2" />
                Return to Credits Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="mt-2 text-gray-600">
            Your purchase has been completed and {state.credits} credits have been added to your account.
          </p>
          <div className="mt-6 bg-green-50 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Credit balance updated
                </p>
                <p className="mt-1 text-sm text-green-700">
                  You can now apply for jobs using your credits.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/credits"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View My Credits
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}