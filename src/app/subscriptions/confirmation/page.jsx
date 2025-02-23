"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionConfirmationPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login?callbackUrl=/subscriptions/confirmation');
    },
  });

  const searchParams = useSearchParams();
  const [confirmationStatus, setConfirmationStatus] = useState({
    loading: true,
    success: null,
    error: null,
    subscriptionDetails: null
  });

  useEffect(() => {
    const verifyPayment = async () => {
      if (status !== "authenticated") return;

      // Get the payment intent ID and status from URL
      const paymentIntentId = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');

      if (!paymentIntentId || redirectStatus !== 'succeeded') {
        setConfirmationStatus({
          loading: false,
          success: false,
          error: 'Invalid payment information',
          subscriptionDetails: null
        });
        return;
      }

      try {
        // Send the payment intent to the server for verification and subscription activation
        const response = await fetch('/api/subscriptions/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to confirm subscription');
        }

        // Update the confirmation status
        setConfirmationStatus({
          loading: false,
          success: true,
          error: null,
          subscriptionDetails: data.subscription
        });
      } catch (error) {
        console.error("Error confirming subscription:", error);
        setConfirmationStatus({
          loading: false,
          success: false,
          error: error.message || 'Failed to confirm subscription',
          subscriptionDetails: null
        });
      }
    };

    if (status === "authenticated") {
      verifyPayment();
    }
  }, [status, searchParams]);

  if (status === "loading" || confirmationStatus.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <h1 className="text-xl font-semibold text-gray-800">Processing your subscription...</h1>
        <p className="text-gray-500 mt-2">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {confirmationStatus.success ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-3 mr-4 mb-4 sm:mb-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Subscription Confirmed</h1>
                  <p className="mt-1 text-gray-500">
                    Your payment was successful and your subscription is now active.
                  </p>
                </div>
              </div>
            </div>
            
            {confirmationStatus.subscriptionDetails && (
              <div className="p-6 sm:p-8 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h2>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium text-gray-900">{confirmationStatus.subscriptionDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium text-gray-900">${confirmationStatus.subscriptionDetails.price}/{confirmationStatus.subscriptionDetails.billingPeriod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Credits</p>
                      <p className="font-medium text-gray-900">{confirmationStatus.subscriptionDetails.credits} credits per {confirmationStatus.subscriptionDetails.billingPeriod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(confirmationStatus.subscriptionDetails.startDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 sm:p-8 flex justify-center">
              <Link 
                href="/dashboard/tradesperson" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-full p-3 mr-4 mb-4 sm:mb-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Subscription Error</h1>
                  <p className="mt-1 text-gray-500">
                    {confirmationStatus.error || "We couldn't confirm your subscription. Please try again or contact support."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 flex justify-center space-x-4">
              <Link 
                href="/subscriptions" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Subscriptions
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}