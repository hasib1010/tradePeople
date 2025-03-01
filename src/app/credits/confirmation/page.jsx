"use client";
import dynamic from 'next/dynamic';

// Dynamically import the PaymentConfirmationPageContent with no SSR
const PaymentConfirmationPageContent = dynamic(() => import('./PaymentConfirmationPageContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="animate-spin mb-4">
        <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
      <p className="mt-2 text-gray-600">Verifying your payment details</p>
    </div>
  )
});

export default function PaymentConfirmationPage() {
  return <PaymentConfirmationPageContent />;
}