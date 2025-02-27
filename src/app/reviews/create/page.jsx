// src/app/reviews/create/page.jsx
"use client"
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

export default function CreateReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const jobId = searchParams.get('jobId');
  const tradespersonId = searchParams.get('tradespersonId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const [tradesperson, setTradesperson] = useState(null);
  const [fetchErrors, setFetchErrors] = useState({
    job: null,
    tradesperson: null
  });
  
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: '',
    content: '',
    workQuality: 0,
    communication: 0,
    punctuality: 0,
    valueForMoney: 0,
    recommendationLikelihood: 0,
  });

  // Fetch job and tradesperson details
  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;
      
      try {
        setLoading(true);
        
        // Fetch job details
        try {
          const jobResponse = await fetch(`/api/jobs/${jobId}`);
          if (!jobResponse.ok) {
            throw new Error(`Failed to load job details: ${jobResponse.status}`);
          }
          const jobData = await jobResponse.json();
          setJobDetails(jobData);
        } catch (err) {
          console.error('Error fetching job details:', err);
          setFetchErrors(prev => ({ ...prev, job: err.message }));
        }
        
        // Fetch tradesperson details - handle separately to avoid one failure affecting the other
        try {
          console.log('Fetching tradesperson:', tradespersonId);
          const tradespersonResponse = await fetch(`/api/users/${tradespersonId}`);
          
          if (!tradespersonResponse.ok) {
            throw new Error(`Failed to load tradesperson details: ${tradespersonResponse.status}`);
          }
          
          const tradespersonData = await tradespersonResponse.json();
          console.log('Tradesperson data:', tradespersonData);
          setTradesperson(tradespersonData);
        } catch (err) {
          console.error('Error fetching tradesperson details:', err);
          setFetchErrors(prev => ({ ...prev, tradesperson: err.message }));
        }
        
        // Check if user already left a review
        try {
          const reviewsResponse = await fetch(`/api/reviews?jobId=${jobId}&reviewerId=${session.user.id}`);
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            
            if (reviewsData.reviews && reviewsData.reviews.length > 0) {
              setError('You have already left a review for this job');
            }
          }
        } catch (err) {
          console.error('Error checking existing reviews:', err);
          // Don't fail the entire page load for this
        }
        
      } catch (err) {
        console.error('Error in fetch data effect:', err);
        setError("Failed to load required data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    if (jobId && tradespersonId && status === "authenticated") {
      fetchData();
    }
  }, [jobId, tradespersonId, status, session?.user?.id]);

  // Handle rating changes
  const handleRatingChange = (category, value) => {
    setReviewData(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (reviewData.rating === 0) {
      setError('Please provide an overall rating');
      return;
    }
    
    if (!reviewData.title.trim()) {
      setError('Please provide a review title');
      return;
    }
    
    if (!reviewData.content.trim()) {
      setError('Please provide review content');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job: jobId,
          tradesperson: tradespersonId,
          reviewer: session.user.id,
          rating: reviewData.rating,
          title: reviewData.title,
          content: reviewData.content,
          categories: {
            workQuality: reviewData.workQuality,
            communication: reviewData.communication,
            punctuality: reviewData.punctuality,
            valueForMoney: reviewData.valueForMoney,
          },
          recommendationLikelihood: reviewData.recommendationLikelihood,
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }
      
      setSuccess(true);
      
      // Redirect to job details after short delay
      setTimeout(() => {
        router.push(`/jobs/${jobId}?reviewSubmitted=true`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render star rating selector
  const RatingSelector = ({ value, onChange, label }) => {
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 mb-1">{label}</span>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
            >
              {star <= value ? (
                <StarIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <StarIconOutline className="h-6 w-6 text-gray-300" />
              )}
            </button>
          ))}
          {value > 0 && <span className="ml-2 text-sm text-gray-500">{value} out of 5</span>}
        </div>
      </div>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push(`/login?callbackUrl=/reviews/create?jobId=${jobId}&tradespersonId=${tradespersonId}`);
    return null;
  }

  // Display a more informative error page when critical data is missing
  if ((fetchErrors.job && fetchErrors.tradesperson) || (!jobDetails && !tradesperson)) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Unable to Load Review Page
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                We couldn't load the necessary data to create your review.
              </p>
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <ul className="list-disc list-inside text-left text-sm text-red-700">
                  {fetchErrors.job && <li>{fetchErrors.job}</li>}
                  {fetchErrors.tradesperson && <li>{fetchErrors.tradesperson}</li>}
                  {!fetchErrors.job && !fetchErrors.tradesperson && <li>Error loading required data</li>}
                </ul>
              </div>
              <div className="mt-6">
                <Link href="/dashboard" className="text-base font-medium text-blue-600 hover:text-blue-500">
                  Go to Dashboard
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Review Submitted Successfully
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                Thank you for sharing your feedback. Your review helps others make informed decisions.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Redirecting you back to the job details...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Leave a Review
          </h1>
          {jobDetails && (
            <p className="mt-1 text-sm text-gray-500">
              For job: {jobDetails.title}
            </p>
          )}
        </div>
        
        {/* Display warnings for missing data but continue with the form */}
        {(fetchErrors.job || fetchErrors.tradesperson) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside">
                    {fetchErrors.job && <li>Some job details could not be loaded: {fetchErrors.job}</li>}
                    {fetchErrors.tradesperson && <li>Tradesperson details could not be loaded: {fetchErrors.tradesperson}</li>}
                  </ul>
                </div>
                <p className="mt-2 text-sm text-yellow-700">
                  You can still submit your review, but some information may be missing.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {tradesperson && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Tradesperson Information
              </h2>
              <div className="flex items-center">
                <img 
                  className="h-16 w-16 rounded-full mr-4" 
                  src={tradesperson.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                  alt={tradesperson.firstName} 
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {tradesperson.firstName} {tradesperson.lastName}
                  </h3>
                  {tradesperson.businessName && (
                    <p className="text-sm text-gray-600">{tradesperson.businessName}</p>
                  )}
                  <div className="mt-1">
                    <span className="text-sm text-gray-600">
                      {tradesperson.skills && tradesperson.skills.slice(0, 3).join(', ')}
                      {tradesperson.skills && tradesperson.skills.length > 3 ? '...' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tradesperson placeholder when data is missing */}
        {!tradesperson && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Tradesperson Information
              </h2>
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full mr-4 bg-gray-200 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Tradesperson
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tradesperson details couldn't be loaded
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Review
            </h2>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <RatingSelector 
                  value={reviewData.rating} 
                  onChange={(value) => handleRatingChange('rating', value)}
                  label="Overall Rating *" 
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Review Title *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={reviewData.title}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Summarize your experience"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Review Content *
                </label>
                <div className="mt-1">
                  <textarea
                    id="content"
                    name="content"
                    rows={5}
                    value={reviewData.content}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Describe your experience working with this tradesperson"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Please be honest and detailed in your review to help other customers make informed decisions.
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-medium text-gray-900">
                  Rate Specific Categories
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <RatingSelector 
                    value={reviewData.workQuality} 
                    onChange={(value) => handleRatingChange('workQuality', value)}
                    label="Work Quality" 
                  />
                  <RatingSelector 
                    value={reviewData.communication} 
                    onChange={(value) => handleRatingChange('communication', value)}
                    label="Communication" 
                  />
                  <RatingSelector 
                    value={reviewData.punctuality} 
                    onChange={(value) => handleRatingChange('punctuality', value)}
                    label="Punctuality & Reliability" 
                  />
                  <RatingSelector 
                    value={reviewData.valueForMoney} 
                    onChange={(value) => handleRatingChange('valueForMoney', value)}
                    label="Value for Money" 
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-medium text-gray-900">
                  Would you recommend this tradesperson?
                </h3>
                <div className="mt-4">
                  <RatingSelector 
                    value={reviewData.recommendationLikelihood} 
                    onChange={(value) => handleRatingChange('recommendationLikelihood', value)}
                    label="Recommendation Likelihood" 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  1 = Definitely not, 5 = Definitely yes
                </p>
              </div>
              
              <div className="pt-5 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}