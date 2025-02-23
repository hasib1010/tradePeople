// components/StripeSubscriptionCheckout.jsx
"use client"
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, X, CheckCircle, AlertTriangle } from 'lucide-react';

// Load Stripe outside of component render cycle
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Payment form component that uses Stripe Elements
function CheckoutForm({ planDetails, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Confirm the payment
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscriptions/confirmation`,
      },
      redirect: 'always',
    });

    if (result.error) {
      // Show error to your customer
      setMessage({
        type: 'error',
        content: result.error.message
      });
      setIsLoading(false);
    }
    // Note: With redirect: 'always', we won't reach the success case here
    // as the user will be redirected to the return_url
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Subscribe to {planDetails.name} Plan</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">{planDetails.name} Plan</p>
            <p className="text-sm text-blue-600">{planDetails.credits} Credits per {planDetails.billingPeriod}</p>
          </div>
          <p className="text-lg font-bold text-gray-900">${planDetails.price.toFixed(2)}/{planDetails.billingPeriod}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <PaymentElement />
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          <div className="flex items-start">
            {message.type === 'error' ? (
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      )}
      
      <button
        disabled={isLoading || !stripe || !elements}
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Subscribe Now - $${planDetails.price.toFixed(2)}/${planDetails.billingPeriod}`
        )}
      </button>
    </form>
  );
}

// Wrapper component that manages the Stripe Elements context
export default function StripeSubscriptionCheckout({ 
  planId, 
  onSuccess,
  onCancel
}) {
  const [clientSecret, setClientSecret] = useState('');
  const [planDetails, setPlanDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create a subscription intent on the server
    const createSubscriptionIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/subscriptions/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize subscription');
        }

        setClientSecret(data.clientSecret);
        setPlanDetails(data.plan);
      } catch (err) {
        setError(err.message);
        console.error('Error creating subscription intent:', err);
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      createSubscriptionIntent();
    }
  }, [planId]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Initializing subscription...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Subscription Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={onCancel}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !planDetails) {
    return null;
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#3b82f6', // blue-500
    },
  };
  
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          planDetails={planDetails} 
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  );
}