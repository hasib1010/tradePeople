"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { CreditCard, CheckCircle, AlertTriangle, DollarSign, History, Package } from 'lucide-react';
import StripeCheckout from '@/components/StripeCheckout';

export default function CreditsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login?callbackUrl=/credits');
    },
  });

  const [creditsData, setCreditsData] = useState({
    available: 0,
    spent: 0,
    transactions: [],
    loading: true,
    error: null,
  });

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  const creditPackages = [
    { id: 'basic', name: 'Basic', credits: 10, price: 9.99, description: 'Perfect for occasional use' },
    { id: 'standard', name: 'Standard', credits: 25, price: 19.99, description: 'Most popular option', featured: true },
    { id: 'premium', name: 'Premium', credits: 60, price: 39.99, description: 'Best value for active users' },
  ];

  useEffect(() => {
    const fetchCreditsData = async () => {
      if (status !== "authenticated") return;
      
      try {
        const response = await fetch('/api/credits');
        
        if (!response.ok) {
          throw new Error('Failed to fetch credits data');
        }
        
        const data = await response.json();
        
        setCreditsData({
          available: data.available || 0,
          spent: data.spent || 0,
          transactions: data.transactions || [],
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching credits data:", error);
        setCreditsData(prev => ({
          ...prev,
          loading: false,
          error: "Failed to load credits data",
        }));
      }
    };

    if (status === "authenticated") {
      fetchCreditsData();
    }
  }, [status]);

  // Re-fetch credits data after successful purchase
  const refreshCreditsData = async () => {
    try {
      const response = await fetch('/api/credits');
      if (!response.ok) {
        throw new Error('Failed to fetch updated credits data');
      }
      
      const data = await response.json();
      
      setCreditsData({
        available: data.available || 0,
        spent: data.spent || 0,
        transactions: data.transactions || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error refreshing credits data:", error);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePurchaseClick = () => {
    if (!selectedPackage) {
      setPurchaseStatus({ success: false, message: 'Please select a credit package' });
      return;
    }
    
    // Show Stripe checkout instead of handling payment directly
    setShowStripeCheckout(true);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Payment was successful, update the UI
    setPurchaseStatus({ 
      success: true, 
      message: `Successfully purchased ${selectedPackage.credits} credits!` 
    });
    
    // Close the Stripe checkout
    setShowStripeCheckout(false);
    
    // Reset selected package
    setSelectedPackage(null);
    
    // Refresh credits data
    await refreshCreditsData();
  };

  const handlePaymentCancel = () => {
    setShowStripeCheckout(false);
    setPurchaseStatus(null);
  };

  if (status === "loading" || creditsData.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Credits</h1>
          <p className="mt-1 text-sm text-gray-500">
            Purchase and manage your job application credits
          </p>
        </div>
        
        {creditsData.error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{creditsData.error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Credit Balance Card */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Your Credit Balance</h2>
                <p className="text-sm text-gray-500">Use credits to apply for jobs</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">{creditsData.available}</p>
                <p className="text-sm text-gray-500">Available Credits</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-700">{creditsData.spent || 0}</p>
                <p className="text-sm text-gray-500">Credits Spent</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* How Credits Work */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">How Credits Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Package className="h-6 w-6 text-blue-500 mr-2" />
                  <h3 className="font-medium">1. Purchase Credits</h3>
                </div>
                <p className="text-sm text-gray-600">Buy credits in packages that fit your needs and budget.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CreditCard className="h-6 w-6 text-green-500 mr-2" />
                  <h3 className="font-medium">2. Apply for Jobs</h3>
                </div>
                <p className="text-sm text-gray-600">Each job application costs 1 credit. Credits never expire.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-6 w-6 text-purple-500 mr-2" />
                  <h3 className="font-medium">3. Get Hired</h3>
                </div>
                <p className="text-sm text-gray-600">No additional costs after you're hired for a job.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Purchase Credits */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Purchase Credits</h2>
            
            {purchaseStatus?.success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{purchaseStatus.message}</p>
                  </div>
                </div>
              </div>
            )}
            
            {purchaseStatus?.success === false && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{purchaseStatus.message}</p>
                  </div>
                </div>
              </div>
            )}
            
            {showStripeCheckout ? (
              <div className="mt-4 mb-8">
                <StripeCheckout
                  packageId={selectedPackage?.id}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </div>
            ) : (
              <div>
                {/* Select Package */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a Credit Package
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {creditPackages.map((pkg) => (
                      <div 
                        key={pkg.id} 
                        className={`border rounded-lg p-4 cursor-pointer relative ${
                          selectedPackage?.id === pkg.id 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${pkg.featured ? 'bg-blue-50' : 'bg-white'}`}
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        {pkg.featured && (
                          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Best Value
                          </span>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                          {selectedPackage?.id === pkg.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">${pkg.price}</p>
                        <p className="text-sm text-blue-600 font-medium mb-2">{pkg.credits} Credits</p>
                        <p className="text-xs text-gray-500">{pkg.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Checkout Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handlePurchaseClick}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={!selectedPackage}
                  >
                    {`Purchase ${selectedPackage ? `${selectedPackage.credits} Credits for $${selectedPackage.price}` : 'Credits'}`}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                  All purchases are final and non-refundable.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Transaction History */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Transaction History
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Recent credit purchases and usage
              </p>
            </div>
            <History className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="bg-white overflow-hidden">
            {creditsData.transactions?.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
                <p className="mt-1 text-sm text-gray-500">Purchase credits to see your transaction history</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditsData.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}