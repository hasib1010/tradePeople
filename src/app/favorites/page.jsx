// src/app/favorites/page.js
"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function FavoritesPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login?callbackUrl=/favorites');
    },
  });
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch('/api/customer/favorites');
        
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        setFavorites(data.favorites || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (status === "authenticated" && session?.user?.role === "customer") {
      fetchFavorites();
    } else if (status === "authenticated" && session?.user?.role !== "customer") {
      router.push('/dashboard');
    }
  }, [status, session, router]);
  
  const handleRemoveFavorite = async (tradespersonId) => {
    try {
      const response = await fetch(`/api/customer/favorites/${tradespersonId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setFavorites(prevFavorites => 
          prevFavorites.filter(person => person._id !== tradespersonId)
        );
      } else {
        throw new Error('Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      // Show error notification in a real app
    }
  };
  
  const sortedFavorites = () => {
    if (!favorites.length) return [];
    
    return [...favorites].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'recent':
          // Assuming there's a savedAt field in the response
          // If not, this would need to be tracked separately
          return new Date(b.savedAt || 0) - new Date(a.savedAt || 0);
        default:
          return 0;
      }
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Saved Tradespeople
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your favorite professionals
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="recent">Recently Saved</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {favorites.length === 0 ? (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-2 text-base font-medium text-gray-900">No saved tradespeople</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't saved any tradespeople to your favorites yet.
            </p>
            <div className="mt-6">
              <Link
                href="/tradespeople"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Find Tradespeople
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedFavorites().map((person) => (
              <div key={person._id} className="bg-white overflow-hidden shadow rounded-lg relative group">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => handleRemoveFavorite(person._id)}
                    className="text-gray-400 hover:text-red-500 focus:outline-none focus:text-red-500 transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
                
                <Link href={`/tradespeople/${person._id}`} className="block hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          className="h-16 w-16 rounded-full object-cover"
                          src={person.profileImage || 'https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg'}
                          alt={`${person.firstName} ${person.lastName}`}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {person.firstName} {person.lastName}
                          {person.isVerified && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </h3>
                        {person.businessName && (
                          <p className="text-sm text-gray-500">{person.businessName}</p>
                        )}
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <svg
                                key={rating}
                                className={`h-4 w-4 ${
                                  rating < Math.floor(person.averageRating)
                                    ? 'text-yellow-400'
                                    : rating < person.averageRating
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
                          <span className="ml-1 text-sm text-gray-500">
                            {person.averageRating?.toFixed(1) || '0.0'} ({person.totalReviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-gray-900 mb-2">
                        <svg className="inline-block h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {person.location?.city || 'Location'}, {person.location?.state || 'N/A'}
                      </div>
                      {person.yearsOfExperience && (
                        <div className="text-sm text-gray-900 mb-2">
                          <svg className="inline-block h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {person.yearsOfExperience} years of experience
                        </div>
                      )}
                      {person.hourlyRate && (
                        <div className="text-sm text-gray-900 mb-2">
                          <svg className="inline-block h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          ${person.hourlyRate}/hour
                        </div>
                      )}
                      {person.availability?.isAvailableNow && (
                        <div className="text-sm font-medium text-green-700">
                          <svg className="inline-block h-4 w-4 text-green-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Available Now
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</h4>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {person.skills?.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {person.skills?.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{person.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <span className="inline-flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 group-hover:bg-blue-700 transition-colors duration-200">
                          View Profile
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}