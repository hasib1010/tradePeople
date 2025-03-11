"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, status, update } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/login?callbackUrl=/profile");
        },
    });

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("basicInfo");
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Define available skill options from the model
    const skillOptions = [
        'Plumbing', 'Electrical', 'Carpentry', 'Painting',
        'Roofing', 'HVAC', 'Landscaping', 'Masonry',
        'Flooring', 'Tiling', 'General Contracting', 'Drywall',
        'Cabinetry', 'Fencing', 'Decking', 'Concrete',
        'Window Installation', 'Door Installation', 'Appliance Repair',
        'Handyman Services', 'Cleaning Services', 'Moving Services',
        'Other'
    ];

    // Define weekdays for availability selection
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "tradesperson") {
                // Redirect non-tradespeople (customers or admins) to a different page
                router.push(session.user.role === "customer" ? "/profile/customer" : "/dashboard");
                return;
            }

            const fetchProfileData = async () => {
                try {
                    const response = await fetch('/api/profile');
                    if (!response.ok) {
                        throw new Error("Failed to load profile data");
                    }
                    const data = await response.json();
                    setProfileData(data.user || {});
                    setFormData(data.user || {});
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                    setError("Failed to load profile data. Please try again later.");
                } finally {
                    setLoading(false);
                }
            };

            fetchProfileData();
        }
    }, [status, session, router]);

     

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle nested objects (e.g., location.city)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleArrayInputChange = (e, index, field) => {
        const { value } = e.target;
        const updatedArray = [...(formData[field] || [])];
        updatedArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: updatedArray }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), '']
        }));
    };

    const removeArrayItem = (index, field) => {
        const updatedArray = [...(formData[field] || [])];
        updatedArray.splice(index, 1);
        setFormData(prev => ({ ...prev, [field]: updatedArray }));
    };

    const handleCheckboxChange = (e, field, value) => {
        const { checked } = e.target;
        const currentArray = [...(formData[field] || [])];

        if (checked && !currentArray.includes(value)) {
            currentArray.push(value);
        } else if (!checked && currentArray.includes(value)) {
            const index = currentArray.indexOf(value);
            currentArray.splice(index, 1);
        }

        setFormData(prev => ({ ...prev, [field]: currentArray }));
    };

    const handleWorkDaysChange = (e) => {
        const { value, checked } = e.target;
        const currentWorkDays = [...(formData.availability?.workDays || [])];

        if (checked && !currentWorkDays.includes(value)) {
            currentWorkDays.push(value);
        } else if (!checked && currentWorkDays.includes(value)) {
            const index = currentWorkDays.indexOf(value);
            currentWorkDays.splice(index, 1);
        }

        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                workDays: currentWorkDays
            }
        }));
    };

    const handleNestedObjectChange = (e, parent, field) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: fieldValue
            }
        }));
    };

    const handleInsuranceChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldName = name.split('.')[1]; // insurance.hasInsurance -> hasInsurance
        const fieldValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            insurance: {
                ...prev.insurance,
                [fieldName]: fieldValue
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setUpdateSuccess(false);

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            const data = await response.json();
            setProfileData(data.user);
            setIsEditing(false);
            setUpdateSuccess(true);

            // Update session data if name or profile image changed
            if (formData.firstName !== session?.user?.firstName ||
                formData.lastName !== session?.user?.lastName ||
                formData.profileImage !== session?.user?.profileImage) {
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        profileImage: formData.profileImage
                    }
                });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setError(error.message || "Failed to update profile. Please try again.");
        } finally {
            setSubmitting(false);

            // Clear success message after 3 seconds
            if (updateSuccess) {
                setTimeout(() => {
                    setUpdateSuccess(false);
                }, 3000);
            }
        }
    };

    const cancelEdit = () => {
        setFormData(profileData || {});
        setIsEditing(false);
    };

    // Add certification field
    const addCertification = () => {
        const newCertification = {
            name: '',
            issuingOrganization: '',
            dateIssued: '',
            expirationDate: '',
            documentUrl: '',
            isVerified: false
        };

        setFormData(prev => ({
            ...prev,
            certifications: [...(prev.certifications || []), newCertification]
        }));
    };

    // Update certification field
    const handleCertificationChange = (e, index, field) => {
        const { value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        const updatedCertifications = [...(formData.certifications || [])];
        updatedCertifications[index] = {
            ...updatedCertifications[index],
            [field]: fieldValue
        };

        setFormData(prev => ({
            ...prev,
            certifications: updatedCertifications
        }));
    };

    // Remove certification
    const removeCertification = (index) => {
        const updatedCertifications = [...(formData.certifications || [])];
        updatedCertifications.splice(index, 1);

        setFormData(prev => ({
            ...prev,
            certifications: updatedCertifications
        }));
    };

    // Add portfolio item
    const addPortfolioItem = () => {
        const newPortfolioItem = {
            title: '',
            description: '',
            imageUrls: [''],
            projectDate: ''
        };

        setFormData(prev => ({
            ...prev,
            portfolio: [...(prev.portfolio || []), newPortfolioItem]
        }));
    };

    // Update portfolio item
    const handlePortfolioChange = (e, index, field) => {
        const { value } = e.target;

        const updatedPortfolio = [...(formData.portfolio || [])];
        updatedPortfolio[index] = {
            ...updatedPortfolio[index],
            [field]: value
        };

        setFormData(prev => ({
            ...prev,
            portfolio: updatedPortfolio
        }));
    };

    // Handle portfolio image URLs
    const handlePortfolioImageChange = (e, portfolioIndex, imageIndex) => {
        const { value } = e.target;

        const updatedPortfolio = [...(formData.portfolio || [])];
        const updatedImageUrls = [...(updatedPortfolio[portfolioIndex].imageUrls || [])];
        updatedImageUrls[imageIndex] = value;

        updatedPortfolio[portfolioIndex] = {
            ...updatedPortfolio[portfolioIndex],
            imageUrls: updatedImageUrls
        };

        setFormData(prev => ({
            ...prev,
            portfolio: updatedPortfolio
        }));
    };

    // Add image URL field to portfolio item
    const addPortfolioImage = (portfolioIndex) => {
        const updatedPortfolio = [...(formData.portfolio || [])];
        updatedPortfolio[portfolioIndex] = {
            ...updatedPortfolio[portfolioIndex],
            imageUrls: [...(updatedPortfolio[portfolioIndex].imageUrls || []), '']
        };

        setFormData(prev => ({
            ...prev,
            portfolio: updatedPortfolio
        }));
    };

    // Remove image URL from portfolio item
    const removePortfolioImage = (portfolioIndex, imageIndex) => {
        const updatedPortfolio = [...(formData.portfolio || [])];
        const updatedImageUrls = [...(updatedPortfolio[portfolioIndex].imageUrls || [])];
        updatedImageUrls.splice(imageIndex, 1);

        updatedPortfolio[portfolioIndex] = {
            ...updatedPortfolio[portfolioIndex],
            imageUrls: updatedImageUrls
        };

        setFormData(prev => ({
            ...prev,
            portfolio: updatedPortfolio
        }));
    };

    // Remove portfolio item
    const removePortfolioItem = (index) => {
        const updatedPortfolio = [...(formData.portfolio || [])];
        updatedPortfolio.splice(index, 1);

        setFormData(prev => ({
            ...prev,
            portfolio: updatedPortfolio
        }));
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View and manage your profile information
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <Link
                                href="/dashboard/tradesperson"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {updateSuccess && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">Profile updated successfully!</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    {/* Profile Header */}
                    <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-24 w-24 relative">
                                <div className="h-24 w-24 rounded-full overflow-hidden">
                                    <img
                                        src={profileData?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
                                        alt={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                {profileData?.isVerified && (
                                    <div className="absolute bottom-0 right-0 bg-green-100 p-1 rounded-full">
                                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="ml-5">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {profileData?.firstName} {profileData?.lastName}
                                    {profileData?.isVerified && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Verified
                                        </span>
                                    )}
                                </h2>
                                {profileData?.businessName && (
                                    <p className="text-sm text-gray-600">{profileData.businessName}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                    {profileData?.location?.city && profileData?.location?.state ?
                                        `${profileData.location.city}, ${profileData.location.state}` :
                                        'Location not set'}
                                </p>
                            </div>
                        </div>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit Profile
                            </button>
                        ) : (
                            <div className="mt-4 md:mt-0 space-x-2">
                                <button
                                    onClick={cancelEdit}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Profile Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex overflow-x-auto px-6">
                            <button
                                onClick={() => setActiveTab("basicInfo")}
                                className={`${activeTab === "basicInfo"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                            >
                                Basic Information
                            </button>
                            <button
                                onClick={() => setActiveTab("professional")}
                                className={`${activeTab === "professional"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                            >
                                Professional
                            </button>
                            <button
                                onClick={() => setActiveTab("services")}
                                className={`${activeTab === "services"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                            >
                                Services & Skills
                            </button>
                            <button
                                onClick={() => setActiveTab("portfolio")}
                                className={`${activeTab === "portfolio"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                            >
                                Portfolio
                            </button>
                            <button
                                onClick={() => setActiveTab("credentials")}
                                className={`${activeTab === "credentials"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Credentials
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="px-4 py-5 sm:p-6">
                        <form onSubmit={handleSubmit}>
                            {/* Basic Information Tab */}
                            {activeTab === "basicInfo" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                        <div className="sm:col-span-3">
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                                First name
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        id="firstName"
                                                        value={formData.firstName || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.firstName || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                                Last name
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        id="lastName"
                                                        value={formData.lastName || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.lastName || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email address
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        id="email"
                                                        value={formData.email || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.email || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                                Phone number
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="phoneNumber"
                                                        id="phoneNumber"
                                                        value={formData.phoneNumber || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.phoneNumber || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                                                Business name
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="businessName"
                                                        id="businessName"
                                                        value={formData.businessName || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.businessName || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                                                Profile Image
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <ImageUpload
                                                        onImageUpload={(url) => setFormData(prev => ({ ...prev, profileImage: url }))}
                                                        currentImage={formData.profileImage}
                                                    />
                                                ) : (
                                                    <div className="flex items-center">
                                                        <img
                                                            src={profileData?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
                                                            alt="Profile"
                                                            className="h-16 w-16 rounded-full object-cover"
                                                        />
                                                        <p className="ml-4 text-sm text-gray-900">
                                                            {profileData?.profileImage ? "Profile image set" : "Default image"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                                                City
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="location.city"
                                                        id="location.city"
                                                        value={formData.location?.city || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.location?.city || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                                                State
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="location.state"
                                                        id="location.state"
                                                        value={formData.location?.state || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.location?.state || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Professional Tab */}
                            {activeTab === "professional" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                        <div className="sm:col-span-6">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                                Professional Bio
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <textarea
                                                        name="description"
                                                        id="description"
                                                        rows="4"
                                                        value={formData.description || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.description || "No bio provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                                                Years of Experience
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        name="yearsOfExperience"
                                                        id="yearsOfExperience"
                                                        min="0"
                                                        value={formData.yearsOfExperience || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.yearsOfExperience || "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                                                Hourly Rate ($)
                                            </label>
                                            <div className="mt-1">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        name="hourlyRate"
                                                        id="hourlyRate"
                                                        min="0"
                                                        value={formData.hourlyRate || ""}
                                                        onChange={handleInputChange}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-900">{profileData?.hourlyRate ? `$${profileData.hourlyRate}/hour` : "Not provided"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Service Area</h3>

                                            <div className="sm:col-span-3 mb-4">
                                                <label htmlFor="serviceArea.radius" className="block text-sm font-medium text-gray-700">
                                                    Service Radius (miles)
                                                </label>
                                                <div className="mt-1">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            name="serviceArea.radius"
                                                            id="serviceArea.radius"
                                                            min="0"
                                                            value={formData.serviceArea?.radius || ""}
                                                            onChange={handleInputChange}
                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-gray-900">
                                                            {profileData?.serviceArea?.radius ? `${profileData.serviceArea.radius} miles` : "Not provided"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Work Availability</h3>

                                            {isEditing ? (
                                                <>
                                                    <div className="mb-4">
                                                        <label htmlFor="availability.isAvailableNow" className="block text-sm font-medium text-gray-700">
                                                            Currently Available for Work?
                                                        </label>
                                                        <div className="mt-1">
                                                            <select
                                                                name="availability.isAvailableNow"
                                                                id="availability.isAvailableNow"
                                                                value={formData.availability?.isAvailableNow ? "true" : "false"}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        availability: {
                                                                            ...prev.availability,
                                                                            isAvailableNow: e.target.value === "true"
                                                                        }
                                                                    }));
                                                                }}
                                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                            >
                                                                <option value="true">Yes</option>
                                                                <option value="false">No</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Available Work Days
                                                        </label>
                                                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                            {weekdays.map((day) => (
                                                                <div key={day} className="flex items-center">
                                                                    <input
                                                                        id={`day-${day}`}
                                                                        name={`day-${day}`}
                                                                        type="checkbox"
                                                                        checked={(formData.availability?.workDays || []).includes(day)}
                                                                        value={day}
                                                                        onChange={handleWorkDaysChange}
                                                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor={`day-${day}`} className="ml-2 block text-sm text-gray-700">
                                                                        {day}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                                                        <div className="sm:col-span-3">
                                                            <label htmlFor="availability.workHours.start" className="block text-sm font-medium text-gray-700">
                                                                Work Hours Start
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="time"
                                                                    name="availability.workHours.start"
                                                                    id="availability.workHours.start"
                                                                    value={formData.availability?.workHours?.start || ""}
                                                                    onChange={(e) => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            availability: {
                                                                                ...prev.availability,
                                                                                workHours: {
                                                                                    ...prev.availability?.workHours,
                                                                                    start: e.target.value
                                                                                }
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="sm:col-span-3">
                                                            <label htmlFor="availability.workHours.end" className="block text-sm font-medium text-gray-700">
                                                                Work Hours End
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="time"
                                                                    name="availability.workHours.end"
                                                                    id="availability.workHours.end"
                                                                    value={formData.availability?.workHours?.end || ""}
                                                                    onChange={(e) => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            availability: {
                                                                                ...prev.availability,
                                                                                workHours: {
                                                                                    ...prev.availability?.workHours,
                                                                                    end: e.target.value
                                                                                }
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="bg-gray-50 rounded-md p-4">
                                                    <div className="mb-2">
                                                        <span className="text-sm font-medium text-gray-500">Currently Available: </span>
                                                        <span className="text-sm text-gray-900">
                                                            {profileData?.availability?.isAvailableNow ? "Yes" : "No"}
                                                        </span>
                                                    </div>

                                                    <div className="mb-2">
                                                        <span className="text-sm font-medium text-gray-500">Work Days: </span>
                                                        <span className="text-sm text-gray-900">
                                                            {profileData?.availability?.workDays?.length > 0
                                                                ? profileData.availability.workDays.join(", ")
                                                                : "Not specified"}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Work Hours: </span>
                                                        <span className="text-sm text-gray-900">
                                                            {profileData?.availability?.workHours?.start && profileData?.availability?.workHours?.end
                                                                ? `${profileData.availability.workHours.start} to ${profileData.availability.workHours.end}`
                                                                : "Not specified"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="sm:col-span-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Insurance Information</h3>

                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center">
                                                        <input
                                                            id="hasInsurance"
                                                            name="insurance.hasInsurance"
                                                            type="checkbox"
                                                            checked={formData.insurance?.hasInsurance || false}
                                                            onChange={handleInsuranceChange}
                                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="hasInsurance" className="ml-2 block text-sm text-gray-700">
                                                            Has Insurance
                                                        </label>
                                                    </div>

                                                    {formData.insurance?.hasInsurance && (
                                                        <>
                                                            <div>
                                                                <label htmlFor="insurance.insuranceProvider" className="block text-sm font-medium text-gray-700">
                                                                    Insurance Provider
                                                                </label>
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="text"
                                                                        name="insurance.insuranceProvider"
                                                                        id="insurance.insuranceProvider"
                                                                        value={formData.insurance?.insuranceProvider || ""}
                                                                        onChange={handleInsuranceChange}
                                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label htmlFor="insurance.policyNumber" className="block text-sm font-medium text-gray-700">
                                                                    Policy Number
                                                                </label>
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="text"
                                                                        name="insurance.policyNumber"
                                                                        id="insurance.policyNumber"
                                                                        value={formData.insurance?.policyNumber || ""}
                                                                        onChange={handleInsuranceChange}
                                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label htmlFor="insurance.coverageAmount" className="block text-sm font-medium text-gray-700">
                                                                    Coverage Amount ($)
                                                                </label>
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="number"
                                                                        name="insurance.coverageAmount"
                                                                        id="insurance.coverageAmount"
                                                                        min="0"
                                                                        value={formData.insurance?.coverageAmount || ""}
                                                                        onChange={handleInsuranceChange}
                                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label htmlFor="insurance.expirationDate" className="block text-sm font-medium text-gray-700">
                                                                    Expiration Date
                                                                </label>
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="date"
                                                                        name="insurance.expirationDate"
                                                                        id="insurance.expirationDate"
                                                                        value={formData.insurance?.expirationDate ? formatDate(formData.insurance.expirationDate) : ""}
                                                                        onChange={handleInsuranceChange}
                                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label htmlFor="insurance.documentUrl" className="block text-sm font-medium text-gray-700">
                                                                    Insurance Document URL
                                                                </label>
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="text"
                                                                        name="insurance.documentUrl"
                                                                        id="insurance.documentUrl"
                                                                        value={formData.insurance?.documentUrl || ""}
                                                                        onChange={handleInsuranceChange}
                                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 rounded-md p-4">
                                                    {profileData?.insurance?.hasInsurance ? (
                                                        <>
                                                            <div className="mb-2">
                                                                <span className="text-sm font-medium text-gray-500">Insurance Provider: </span>
                                                                <span className="text-sm text-gray-900">
                                                                    {profileData.insurance.insuranceProvider || "Not specified"}
                                                                </span>
                                                            </div>

                                                            <div className="mb-2">
                                                                <span className="text-sm font-medium text-gray-500">Coverage Amount: </span>
                                                                <span className="text-sm text-gray-900">
                                                                    {profileData.insurance.coverageAmount
                                                                        ? `$${profileData.insurance.coverageAmount.toLocaleString()}`
                                                                        : "Not specified"}
                                                                </span>
                                                            </div>

                                                            <div className="mb-2">
                                                                <span className="text-sm font-medium text-gray-500">Expiration Date: </span>
                                                                <span className="text-sm text-gray-900">
                                                                    {profileData.insurance.expirationDate
                                                                        ? formatDate(profileData.insurance.expirationDate)
                                                                        : "Not specified"}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Verification Status: </span>
                                                                <span className={`text-sm ${profileData.insurance.isVerified ? "text-green-600" : "text-gray-900"}`}>
                                                                    {profileData.insurance.isVerified ? "Verified" : "Not verified"}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No insurance information provided</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Services & Skills Tab */}
                            {activeTab === "services" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Skills & Expertise</h3>
                                        <p className="mt-1 text-sm text-gray-500">Select the services you offer</p>

                                        {isEditing ? (
                                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                                {skillOptions.map((skill) => (
                                                    <div key={skill} className="flex items-center">
                                                        <input
                                                            id={`skill-${skill}`}
                                                            name={`skill-${skill}`}
                                                            type="checkbox"
                                                            checked={(formData.skills || []).includes(skill)}
                                                            value={skill}
                                                            onChange={(e) => handleCheckboxChange(e, 'skills', skill)}
                                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`skill-${skill}`} className="ml-2 block text-sm text-gray-700">
                                                            {skill}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                {profileData?.skills?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {profileData.skills.map((skill) => (
                                                            <span
                                                                key={skill}
                                                                className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">No skills selected</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Portfolio Tab */}
                            {activeTab === "portfolio" && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-gray-900">Portfolio</h3>
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={addPortfolioItem}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Add Project
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">Showcase your past work and projects</p>

                                        <div className="mt-4 space-y-6">
                                            {isEditing ? (
                                                formData.portfolio?.length > 0 ? (
                                                    formData.portfolio.map((item, index) => (
                                                        <div key={index} className="bg-gray-50 p-4 rounded-md relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => removePortfolioItem(index)}
                                                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                                                            >
                                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>

                                                            <div className="grid grid-cols-1 gap-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        Project Title
                                                                    </label>
                                                                    <div className="mt-1">
                                                                        <input
                                                                            type="text"
                                                                            value={item.title || ""}
                                                                            onChange={(e) => handlePortfolioChange(e, index, 'title')}
                                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        Description
                                                                    </label>
                                                                    <div className="mt-1">
                                                                        <textarea
                                                                            rows="3"
                                                                            value={item.description || ""}
                                                                            onChange={(e) => handlePortfolioChange(e, index, 'description')}
                                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        Project Date
                                                                    </label>
                                                                    <div className="mt-1">
                                                                        <input
                                                                            type="date"
                                                                            value={formatDate(item.projectDate)}
                                                                            onChange={(e) => handlePortfolioChange(e, index, 'projectDate')}
                                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div className="flex justify-between items-center">
                                                                        <label className="block text-sm font-medium text-gray-700">
                                                                            Image URLs
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => addPortfolioImage(index)}
                                                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                        >
                                                                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                    <div className="mt-1 space-y-2">
                                                                        {item.imageUrls?.map((url, imgIndex) => (
                                                                            <div key={imgIndex} className="flex items-center">
                                                                                <input
                                                                                    type="text"
                                                                                    value={url || ""}
                                                                                    onChange={(e) => handlePortfolioImageChange(e, index, imgIndex)}
                                                                                    placeholder="https://example.com/image.jpg"
                                                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removePortfolioImage(index, imgIndex)}
                                                                                    className="ml-2 text-gray-400 hover:text-gray-500"
                                                                                    disabled={item.imageUrls.length <= 1}
                                                                                >
                                                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 bg-gray-50 rounded-md">
                                                        <p className="text-sm text-gray-500">No portfolio items yet. Click "Add Project" to get started.</p>
                                                    </div>
                                                )
                                            ) : (
                                                profileData?.portfolio?.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {profileData.portfolio.map((item, index) => (<div key={index} className="bg-white shadow overflow-hidden sm:rounded-lg">
                                                            <div className="px-4 py-5 sm:px-6">
                                                                <h3 className="text-lg leading-6 font-medium text-gray-900">{item.title}</h3>
                                                                <p className="mt-1 text-sm text-gray-500">
                                                                    {formatDate(item.projectDate)}
                                                                </p>
                                                            </div>
                                                            {item.imageUrls && item.imageUrls.length > 0 && (
                                                                <div className="border-t border-gray-200">
                                                                    <div className="aspect-w-16 aspect-h-9 sm:aspect-none sm:h-48">
                                                                        <img
                                                                            src={item.imageUrls[0]}
                                                                            alt={item.title}
                                                                            className="w-full h-full object-cover sm:w-full sm:h-full"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                                                                <p className="text-sm text-gray-700">{item.description}</p>

                                                                {item.imageUrls && item.imageUrls.length > 1 && (
                                                                    <div className="mt-4">
                                                                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Images</h4>
                                                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                                                            {item.imageUrls.slice(1).map((img, imgIndex) => (
                                                                                <div key={imgIndex} className="h-20 bg-gray-100 rounded overflow-hidden">
                                                                                    <img
                                                                                        src={img}
                                                                                        alt={`${item.title} ${imgIndex + 2}`}
                                                                                        className="h-full w-full object-cover"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-base font-medium text-gray-900">No portfolio items</h3>
                                                        <p className="mt-1 text-sm text-gray-500">Add projects to showcase your work.</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Credentials Tab */}
                            {activeTab === "credentials" && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-gray-900">Certifications & Licenses</h3>
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={addCertification}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Add Certification
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">Professional qualifications and credentials</p>

                                        <div className="mt-4 space-y-6">
                                            {isEditing ? (
                                                formData.certifications?.length > 0 ? (
                                                    formData.certifications.map((cert, index) => (
                                                        <div key={index} className="bg-gray-50 p-4 rounded-md relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCertification(index)}
                                                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                                                            >
                                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>

                                                            <div className="grid grid-cols-1 gap-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        Certification Name
                                                                    </label>
                                                                    <div className="mt-1">
                                                                        <input
                                                                            type="text"
                                                                            value={cert.name || ""}
                                                                            onChange={(e) => handleCertificationChange(e, index, 'name')}
                                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        Issuing Organization
                                                                    </label>
                                                                    <div className="mt-1">
                                                                        <input
                                                                            type="text"
                                                                            value={cert.issuingOrganization || ""}
                                                                            onChange={(e) => handleCertificationChange(e, index, 'issuingOrganization')}
                                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700">
                                                                            Date Issued
                                                                        </label>
                                                                        <div className="mt-1">
                                                                            <input
                                                                                type="date"
                                                                                value={formatDate(cert.dateIssued)}
                                                                                onChange={(e) => handleCertificationChange(e, index, 'dateIssued')}
                                                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700">
                                                                            Expiration Date
                                                                        </label>
                                                                        <div className="mt-1">
                                                                            <input
                                                                                type="date"
                                                                                value={formatDate(cert.expirationDate)}
                                                                                onChange={(e) => handleCertificationChange(e, index, 'expirationDate')}
                                                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        Document URL
                                                                    </label>
                                                                    <div className="mt-1">
                                                                        <input
                                                                            type="text"
                                                                            value={cert.documentUrl || ""}
                                                                            onChange={(e) => handleCertificationChange(e, index, 'documentUrl')}
                                                                            placeholder="https://example.com/certificate.pdf"
                                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 bg-gray-50 rounded-md">
                                                        <p className="text-sm text-gray-500">No certifications yet. Click "Add Certification" to get started.</p>
                                                    </div>
                                                )
                                            ) : (
                                                profileData?.certifications?.length > 0 ? (
                                                    <div className="overflow-hidden">
                                                        <ul className="divide-y divide-gray-200">
                                                            {profileData.certifications.map((cert, index) => (
                                                                <li key={index} className="px-4 py-4 sm:px-6">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex flex-col">
                                                                            <h4 className="text-base font-medium text-gray-900">{cert.name}</h4>
                                                                            <p className="text-sm text-gray-500">{cert.issuingOrganization}</p>
                                                                        </div>
                                                                        {cert.isVerified && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-2 sm:flex sm:justify-between">
                                                                        <div className="sm:flex">
                                                                            <p className="flex items-center text-sm text-gray-500">
                                                                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Issued: {formatDate(cert.dateIssued)}
                                                                            </p>
                                                                            {cert.expirationDate && (
                                                                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Expires: {formatDate(cert.expirationDate)}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {cert.documentUrl && (
                                                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                                <a
                                                                                    href={cert.documentUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center text-blue-600 hover:text-blue-500"
                                                                                >
                                                                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
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
                                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-base font-medium text-gray-900">No certifications</h3>
                                                        <p className="mt-1 text-sm text-gray-500">Add your certifications and licenses here.</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form Submit Button - Only show when in edit mode */}
                            {isEditing && (
                                <div className="pt-5 border-t border-gray-200 mt-8">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}