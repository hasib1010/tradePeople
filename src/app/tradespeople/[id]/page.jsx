"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function TradespersonProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [tradesperson, setTradesperson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  useEffect(() => {
    const fetchTradespersonData = async () => {
      try {
        const response = await fetch(`/api/tradespeople/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Tradesperson not found');
          }
          throw new Error('Failed to load tradesperson profile');
        }
        
        const data = await response.json();
        setTradesperson(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tradesperson data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    const checkIfFavorite = async () => {
      if (session?.user?.role === 'customer') {
        try {
          const response = await fetch('/api/customer/favorites');
          if (response.ok) {
            const data = await response.json();
            const isFav = data.favorites.some(fav => fav._id === id);
            setIsFavorite(isFav);
          }
        } catch (err) {
          console.error('Error checking favorites:', err);
        }
      }
    };
    
    fetchTradespersonData();
    if (session) checkIfFavorite();
  }, [id, session]);
  
  const toggleFavorite = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/tradespeople/${id}`);
      return;
    }
    
    if (session.user.role !== 'customer') {
      return;
    }
    
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(`/api/customer/favorites/${id}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error('Error updating favorite:', err);
    }
  };
  
  const handleHireClick = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/tradespeople/${id}`);
      return;
    }
    
    if (session.user.role !== 'customer') {
      return;
    }
    
    router.push(`/jobs/post?tradesperson=${id}`);
  };
  
  const handleContactRequest = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/tradespeople/${id}`);
      return;
    }
    
    if (session.user.role !== 'customer') {
      return;
    }
    
    // In a real app, this might create a conversation or show contact info
    setShowContactInfo(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Profile Not Found
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                {error}
              </p>
              <div className="mt-6">
                <Link href="/tradespeople" className="text-base font-medium text-blue-600 hover:text-blue-500">
                  Back to tradespeople directory
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!tradesperson) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-start md:justify-between md:space-x-5">
            <div className="flex items-start space-x-5">
              <div className="flex-shrink-0">
                <div className="relative h-32 w-32 rounded-full overflow-hidden">
                  <img
                    src={tradesperson.profileImage || 'https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg'}
                    alt={`${tradesperson.firstName} ${tradesperson.lastName}`}
                    className="h-full w-full object-cover"
                  />
                  {tradesperson.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-green-100 p-1 rounded-full">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {tradesperson.firstName} {tradesperson.lastName}
                  {tradesperson.isVerified && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </h1>
                {tradesperson.businessName && (
                  <p className="text-sm text-gray-600 mt-1">{tradesperson.businessName}</p>
                )}
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {tradesperson.location?.city}, {tradesperson.location?.state}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    {tradesperson.yearsOfExperience} years of experience
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {tradesperson.jobsCompleted?.length || 0} jobs completed
                  </div>
                  {tradesperson.availability?.isAvailableNow && (
                    <div className="mt-2 flex items-center text-sm text-green-600 font-medium">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Available Now
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <svg
                        key={rating}
                        className={`h-5 w-5 ${
                          rating < Math.floor(tradesperson.averageRating)
                            ? 'text-yellow-400'
                            : rating < tradesperson.averageRating
                            ? 'text-yellow-300'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="ml-2 text-sm text-gray-700">
                    {tradesperson.averageRating.toFixed(1)}
                    <span className="text-gray-500 ml-1">
                      ({tradesperson.totalReviews} reviews)
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-reverse sm:space-y-0 sm:space-x-3 md:mt-0 md:flex-row md:space-x-3">
              {session?.user?.role === 'customer' && (
                <>
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg 
                      className={`-ml-1 mr-2 h-5 w-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      stroke="currentColor"
                      fill={isFavorite ? 'currentColor' : 'none'}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={isFavorite ? 0 : 2} 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                    {isFavorite ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContactRequest}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={handleHireClick}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Hire Now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact info modal */}
      {showContactInfo && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="contact-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Contact Information
                  </h3>
                  <div className="mt-4">
                    <div className="bg-gray-50 rounded-lg py-5 px-6 mb-4">
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-900 font-medium">{tradesperson.email || 'Not available'}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="text-gray-700">Phone:</span>
                        <span className="ml-2 text-gray-900 font-medium">{tradesperson.phoneNumber || 'Not available'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      When contacting this tradesperson, please mention that you found them on our platform.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setShowContactInfo(false)}
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`${
                activeTab === 'credentials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Credentials
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700">{tradesperson.description || 'No description provided.'}</p>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {tradesperson.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                  {!tradesperson.skills?.length && (
                    <p className="text-gray-500 italic">No skills listed</p>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Service Area</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {tradesperson.serviceArea?.radius ? (
                    <p className="text-gray-700">
                      Serves within {tradesperson.serviceArea.radius} miles of {tradesperson.location?.city}, {tradesperson.location?.state}
                    </p>
                  ) : tradesperson.serviceArea?.cities?.length > 0 ? (
                    <div>
                      <p className="text-gray-700 mb-2">Serves the following areas:</p>
                      <div className="flex flex-wrap gap-2">
                        {tradesperson.serviceArea.cities.map((city, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No service area specified</p>
                  )}
                </div>
              </div>

              <div>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Details</h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Hourly Rate
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {tradesperson.hourlyRate ? `$${tradesperson.hourlyRate}/hour` : 'Not specified'}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Experience
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {tradesperson.yearsOfExperience} years
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Availability
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {tradesperson.availability?.workDays?.length > 0 ? (
                            <div>
                              <div className="mb-2">
                                <span className="font-medium">Available days:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tradesperson.availability.workDays.map((day) => (
                                    <span key={day} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {day}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {tradesperson.availability.workHours && (
                                <div>
                                  <span className="font-medium">Working hours:</span>{' '}
                                  {tradesperson.availability.workHours.start} - {tradesperson.availability.workHours.end}
                                </div>
                              )}
                            </div>
                          ) : (
                            'Not specified'
                          )}
                        </dd>
                      </div>
                      {tradesperson.insurance?.hasInsurance && (
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Insurance
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Insured
                              {tradesperson.insurance.isVerified && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Verified
                                </span>
                              )}
                            </div>
                            {tradesperson.insurance.coverageAmount && (
                              <p className="mt-1 text-sm">
                                Coverage: ${tradesperson.insurance.coverageAmount.toLocaleString()}
                              </p>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                {/* Member since card */}
                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Account Information
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Member since
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {formatDate(tradesperson.createdAt)}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Last active
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {formatDate(tradesperson.lastLogin) || 'Recently'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Services Offered</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Professional services provided by {tradesperson.firstName}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {tradesperson.skills?.map((skill) => (
                    <div key={skill} className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{skill}</h3>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {tradesperson.yearsOfExperience} years of experience
                        </div>
                        {tradesperson.hourlyRate && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            Starting at ${tradesperson.hourlyRate}/hour
                          </div>
                        )}
                        {session?.user?.role === 'customer' && (
                          <div className="mt-5">
                            <button
                              onClick={handleHireClick}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Request Service
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!tradesperson.skills?.length && (
                    <div className="sm:col-span-3 text-center py-12 bg-gray-50 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="mt-2 text-base font-medium text-gray-900">No services listed</h3>
                      <p className="mt-1 text-sm text-gray-500">This tradesperson hasn't listed specific services yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Ideal Project Types</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Projects that {tradesperson.firstName} specializes in
                </p>

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {tradesperson.skills?.slice(0, 3).map((skill, idx) => (
                      <li key={idx} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {skill} projects
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Specialty
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                              </svg>
                              Perfect for {idx === 0 ? 'residential' : idx === 1 ? 'commercial' : 'renovation'} projects
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Project Portfolio</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Past work completed by {tradesperson.firstName}
                </p>
              </div>

              {tradesperson.portfolio?.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tradesperson.portfolio.map((project, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="relative aspect-w-16 aspect-h-9">
                        {project.imageUrls?.length > 0 ? (
                          <img 
                            src={project.imageUrls[0]} 
                            alt={project.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(project.projectDate)}
                        </p>
                        <p className="mt-3 text-sm text-gray-700">
                          {project.description}
                        </p>
                        {project.imageUrls?.length > 1 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</h4>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {project.imageUrls.slice(1, 4).map((img, idx) => (
                                <div key={idx} className="relative h-20">
                                  <img 
                                    src={img} 
                                    alt={`${project.title} ${idx + 1}`} 
                                    className="h-full w-full object-cover rounded"
                                  />
                                </div>
                              ))}
                              {project.imageUrls.length > 4 && (
                                <div className="relative h-20 rounded bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    +{project.imageUrls.length - 4} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-base font-medium text-gray-900">No portfolio projects</h3>
                  <p className="mt-1 text-sm text-gray-500">This tradesperson hasn't added any portfolio projects yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
                <div className="mt-3 flex items-center">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <svg
                        key={rating}
                        className={`h-5 w-5 ${
                          rating < Math.floor(tradesperson.averageRating)
                            ? 'text-yellow-400'
                            : rating < tradesperson.averageRating
                            ? 'text-yellow-300'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="ml-2 text-sm text-gray-700">
                    <span className="font-medium">{tradesperson.averageRating.toFixed(1)} out of 5 stars</span> ({tradesperson.totalReviews} reviews)
                  </p>
                </div>
              </div>

              {/* Review filters and sorting would go here in a real app */}

              <div className="flow-root">
                <ul className="-my-8">
                  {[1, 2, 3].map((idx) => (
                    <li key={idx} className="py-8 border-b border-gray-200">
                      <div className="flex items-center">
                        <img
                          src={`https://randomuser.me/api/portraits/${idx % 2 === 0 ? 'men' : 'women'}/${idx + 50}.jpg`}
                          alt={`Reviewer ${idx}`}
                          className="h-12 w-12 rounded-full"
                        />
                        <div className="ml-4">
                          <h4 className="text-sm font-bold text-gray-900">John Doe</h4>
                          <div className="mt-1 flex items-center">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <svg
                                key={rating}
                                className={`h-4 w-4 ${
                                  rating < 5 - idx
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <p className="ml-2 text-sm text-gray-500">
                              {new Date(2025, 0, idx * 7).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-6 text-base italic text-gray-600">
                        <p>
                          {idx === 1 
                            ? "Excellent work! Completed the project on time and within budget. Very professional and knowledgeable." 
                            : idx === 2 
                            ? "Good communication throughout the project. Quality work and very attentive to details."
                            : "Showed up on time, completed work as promised, and left the work area clean. Would hire again!"}
                        </p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">
                          Project: {idx === 1 ? 'Bathroom Renovation' : idx === 2 ? 'Electrical Rewiring' : 'Drywall Repair'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                {tradesperson.totalReviews > 3 && (
                  <div className="mt-8 text-sm text-center">
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                      Read all {tradesperson.totalReviews} reviews
                      <span aria-hidden="true"> &rarr;</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div>
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Certifications & Licenses</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Professional qualifications and credentials
                </p>

                {tradesperson.certifications?.length > 0 ? (
                  <div className="mt-6 overflow-hidden bg-white shadow sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {tradesperson.certifications.map((cert, idx) => (
                        <li key={idx}>
                          <div className="px-4 py-5 sm:px-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {cert.name}
                                {cert.isVerified && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                  </span>
                                )}
                              </h3>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4z" clipRule="evenodd" />
                                  </svg>
                                  {cert.issuingOrganization}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <p>
                                  Issued: {formatDate(cert.dateIssued)}
                                  {cert.expirationDate && ` • Expires: ${formatDate(cert.expirationDate)}`}
                                </p>
                              </div>
                            </div>
                            {cert.documentUrl && (
                              <div className="mt-4">
                                <a
                                  href={cert.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                 <svg className="-ml-0.5 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    <path d="M8 11a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0-3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                  </svg>
                                  View Certificate
                                </a>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-6 text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-base font-medium text-gray-900">No certifications listed</h3>
                    <p className="mt-1 text-sm text-gray-500">This tradesperson hasn't added any certifications yet.</p>
                  </div>
                )}
              </div>

              {/* Insurance section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Insurance Information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Coverage details and verification
                </p>

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Insurance Status</h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      {tradesperson.insurance?.hasInsurance ? (
                        <>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Insured
                                {tradesperson.insurance.isVerified && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </dd>
                          </div>
                          {tradesperson.insurance.insuranceProvider && (
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Insurance Provider</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {tradesperson.insurance.insuranceProvider}
                              </dd>
                            </div>
                          )}
                          {tradesperson.insurance.coverageAmount && (
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Coverage Amount</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                ${tradesperson.insurance.coverageAmount.toLocaleString()}
                              </dd>
                            </div>
                          )}
                          {tradesperson.insurance.expirationDate && (
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {formatDate(tradesperson.insurance.expirationDate)}
                              </dd>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-gray-50 px-4 py-5 sm:px-6">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-500">No insurance information available</span>
                          </div>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              {/* Education and Training section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Education & Training</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Professional development and qualifications
                </p>

                {/* Mock data - in a real app this would come from the API */}
                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {tradesperson.skills?.length > 0 ? (
                      <>
                        <li>
                          <div className="px-4 py-5 sm:px-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Technical Training
                              </h3>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                  </svg>
                                  Technical Institute of {tradesperson.skills[0]}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <p>
                                  Completed: {new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).getFullYear()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="px-4 py-5 sm:px-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Professional Development
                              </h3>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                  </svg>
                                  Ongoing skills development in {tradesperson.skills.slice(0, 2).join(' and ')}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                </svg>
                                <p>
                                  {tradesperson.yearsOfExperience} years of practical training
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      </>
                    ) : (
                      <li className="px-4 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="mt-2 text-base font-medium text-gray-900">No educational information listed</h3>
                        <p className="mt-1 text-sm text-gray-500">This tradesperson hasn't added any education or training details yet.</p>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}