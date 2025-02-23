"use client"
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';

export default function TradespeopleDirectory() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [tradespeople, setTradespeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState([]);

    // Filter states
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
        city: searchParams.get('city') || '',
        state: searchParams.get('state') || '',
        rating: searchParams.get('rating') || '',
        availableNow: searchParams.get('availableNow') === 'true',
        minExperience: searchParams.get('minExperience') || '',
    });

    const [showFilters, setShowFilters] = useState(false);

    // Skills options based on your model
    const skillOptions = [
        'Plumbing', 'Electrical', 'Carpentry', 'Painting',
        'Roofing', 'HVAC', 'Landscaping', 'Masonry',
        'Flooring', 'Tiling', 'General Contracting', 'Drywall',
        'Cabinetry', 'Fencing', 'Decking', 'Concrete',
        'Window Installation', 'Door Installation', 'Appliance Repair',
        'Handyman Services', 'Cleaning Services', 'Moving Services',
        'Other'
    ];

    useEffect(() => {
        const fetchTradespeople = async () => {
            try {
                // Build query string from filters
                const queryParams = new URLSearchParams();

                if (filters.search) queryParams.append('search', filters.search);
                if (filters.skills.length > 0) queryParams.append('skills', filters.skills.join(','));
                if (filters.city) queryParams.append('city', filters.city);
                if (filters.state) queryParams.append('state', filters.state);
                if (filters.rating) queryParams.append('minRating', filters.rating);
                if (filters.availableNow) queryParams.append('availableNow', 'true');
                if (filters.minExperience) queryParams.append('minExperience', filters.minExperience);

                const response = await fetch(`/api/tradespeople?${queryParams.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch tradespeople');
                }

                const data = await response.json();
                setTradespeople(data.tradespeople);
                setLoading(false);

                // Update URL with current filters
                const newUrl = `/tradespeople?${queryParams.toString()}`;
                window.history.replaceState({}, '', newUrl);

            } catch (err) {
                console.error('Error fetching tradespeople:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        const fetchFavorites = async () => {
            if (session?.user?.role === 'customer') {
                try {
                    const response = await fetch('/api/customer/favorites');
                    if (response.ok) {
                        const data = await response.json();
                        setFavorites(data.favorites.map(fav => fav._id));
                    }
                } catch (err) {
                    console.error('Error fetching favorites:', err);
                }
            }
        };

        fetchTradespeople();
        if (session?.user) fetchFavorites();
    }, [filters, session]);

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSkillToggle = (skill) => {
        setFilters(prev => {
            const updatedSkills = prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill];

            return {
                ...prev,
                skills: updatedSkills
            };
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Search is already handled by the filter changes
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            skills: [],
            city: '',
            state: '',
            rating: '',
            availableNow: false,
            minExperience: '',
        });
    };

    const toggleFavorite = async (tradespersonId) => {
        if (!session) {
            router.push('/login?callbackUrl=/tradespeople');
            return;
        }

        if (session.user.role !== 'customer') {
            // Only customers can add favorites
            return;
        }

        try {
            const isFavorite = favorites.includes(tradespersonId);
            const method = isFavorite ? 'DELETE' : 'POST';

            const response = await fetch(`/api/customer/favorites/${tradespersonId}`, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setFavorites(prev =>
                    isFavorite
                        ? prev.filter(id => id !== tradespersonId)
                        : [...prev, tradespersonId]
                );
            }
        } catch (err) {
            console.error('Error updating favorite:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Find Qualified Tradespeople
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Connect with skilled professionals for your home improvement and repair projects
                    </p>
                </div>

                {/* Search and Filter UI */}
                <div className="mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                        {/* Search input */}
                        <div className="flex-1">
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <Input
                                    type="text"
                                    name="search"
                                    placeholder="Search by name, skill, or business name"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Location fields */}
                        <div className="w-full md:w-64">
                            <Input
                                type="text"
                                name="city"
                                placeholder="City"
                                value={filters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="w-full md:w-64">
                            <Input
                                type="text"
                                name="state"
                                placeholder="State"
                                value={filters.state}
                                onChange={(e) => handleFilterChange('state', e.target.value)}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        {/* Filter toggle and search button */}
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                                Filters
                            </button>

                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Extended filters */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-white rounded-md shadow">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Skills filter */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {skillOptions.slice(0, 10).map((skill) => (
                                            <div key={skill} className="flex items-center">
                                                <input
                                                    id={`skill-${skill}`}
                                                    name="skills"
                                                    type="checkbox"
                                                    checked={filters.skills.includes(skill)}
                                                    onChange={() => handleSkillToggle(skill)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`skill-${skill}`} className="ml-2 text-sm text-gray-700">
                                                    {skill}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {skillOptions.length > 10 && (
                                        <button
                                            type="button"
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                                            // Implement a modal or dropdown for all skills
                                            onClick={() => alert('Show all skills')}
                                        >
                                            Show more skills
                                        </button>
                                    )}
                                </div>

                                {/* Ratings and experience filter */}
                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Minimum Rating</h3>
                                        <select
                                            name="rating"
                                            value={filters.rating}
                                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Any Rating</option>
                                            <option value="4">4+ Stars</option>
                                            <option value="4.5">4.5+ Stars</option>
                                            <option value="5">5 Stars</option>
                                        </select>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Years of Experience</h3>
                                        <select
                                            name="minExperience"
                                            value={filters.minExperience}
                                            onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Any Experience</option>
                                            <option value="1">1+ Years</option>
                                            <option value="3">3+ Years</option>
                                            <option value="5">5+ Years</option>
                                            <option value="10">10+ Years</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Availability filter */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Availability</h3>
                                    <div className="flex items-center">
                                        <input
                                            id="availableNow"
                                            name="availableNow"
                                            type="checkbox"
                                            checked={filters.availableNow}
                                            onChange={(e) => handleFilterChange('availableNow', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="availableNow" className="ml-2 text-sm text-gray-700">
                                            Available Now
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {error ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
                ) : tradespeople.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="mt-2 text-base font-medium text-gray-900">No tradespeople found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                        {(filters.search || filters.skills.length > 0 || filters.city || filters.state || filters.rating || filters.availableNow || filters.minExperience) && (
                            <button
                                onClick={clearFilters}
                                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tradespeople.map((person) => (
                            <div key={person._id} className="bg-white overflow-hidden shadow rounded-lg">
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
                                                            className={`h-4 w-4 ${rating < Math.floor(person.averageRating)
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
                                                    {person.averageRating.toFixed(1)} ({person.totalReviews} reviews)
                                                </span>
                                            </div>
                                        </div>
                                        {session?.user?.role === 'customer' && (
                                            <button
                                                onClick={() => toggleFavorite(person._id)}
                                                className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg
                                                    className={`h-6 w-6 ${favorites.includes(person._id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    fill="none"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={favorites.includes(person._id) ? 0 : 2}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-sm text-gray-900 mb-2">
                                            <svg className="inline-block h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            {person.location?.city}, {person.location?.state}
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
                                            <div className="text-sm font-medium text-green-700 mb-2">
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
                                            {person.skills?.slice(0, 5).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {person.skills?.length > 5 && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    +{person.skills.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center">
                                        <div>
                                            {person.insurance?.hasInsurance && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Insured
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            href={`/tradespeople/${person._id}`}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination (if needed) */}
                {tradespeople.length > 0 && (
                    <div className="mt-8 flex justify-center">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <a
                                href="#"
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                aria-current="page"
                                className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                            >
                                1
                            </a>
                            <a
                                href="#"
                                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                            >
                                2
                            </a>
                            <a
                                href="#"
                                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"
                            >
                                3
                            </a>
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                            </span>
                            <a
                                href="#"
                                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                            >
                                8
                            </a>
                            <a
                                href="#"
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}