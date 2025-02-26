"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import FileUploadSection from '@/components/FileUploadSection';
import { CreditCard, AlertTriangle, CheckCircle, X, DollarSign } from 'lucide-react';

export default function JobApplicationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push(`/login?callbackUrl=/jobs/${id}/apply`);
        },
    });

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [fileUploadError, setFileUploadError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [credits, setCredits] = useState(0);
    const [showCreditModal, setShowCreditModal] = useState(false);

    const [formData, setFormData] = useState({
        coverLetter: '',
        bidType: 'fixed',
        bidAmount: '',
        estimatedHours: '',
        estimatedDays: '',
        canStartOn: '',
        availableDays: [],
        preferredHoursStart: '09:00',
        preferredHoursEnd: '17:00',
        additionalDetails: '',
        attachments: []
    });

    const availableDaysOptions = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday',
        'Friday', 'Saturday', 'Sunday'
    ];

    // Fetch job details and credit information
    useEffect(() => {
        const fetchJobDataAndCredits = async () => {
            try {
                // Fetch job details
                const jobResponse = await fetch(`/api/jobs/${id}`);
                if (!jobResponse.ok) {
                    if (jobResponse.status === 404) {
                        throw new Error('Job not found');
                    }
                    throw new Error('Failed to load job details');
                }
                const jobData = await jobResponse.json();
                setJob(jobData);

                // If job is not open, redirect to job details
                if (jobData.status !== 'open') {
                    setError('This job is no longer accepting applications');
                    setTimeout(() => {
                        router.push(`/jobs/${id}`);
                    }, 3000);
                    return;
                }

                // Set initial bid based on job budget type
                if (jobData.budget?.type === 'fixed' && jobData.budget?.minAmount) {
                    setFormData(prev => ({
                        ...prev,
                        bidAmount: jobData.budget.minAmount.toString()
                    }));
                }

                // Fetch credits information
                const creditsResponse = await fetch('/api/credits');
                if (creditsResponse.ok) {
                    const creditsData = await creditsResponse.json();
                    setCredits(creditsData.available || 0);
                } else {
                    console.error('Failed to fetch credits data');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        // Check if already applied
        const checkApplicationStatus = async () => {
            try {
                const response = await fetch(`/api/jobs/${id}/applications/check`);

                if (response.ok) {
                    const data = await response.json();

                    if (data.hasApplied) {
                        setError('You have already applied to this job');
                        setTimeout(() => {
                            router.push(`/jobs/${id}`);
                        }, 3000);
                    }
                }
            } catch (err) {
                console.error('Error checking application status:', err);
            }
        };

        if (status === "authenticated") {
            // Check if tradesperson
            if (session.user.role !== "tradesperson") {
                router.push(`/jobs/${id}`);
                return;
            }

            fetchJobDataAndCredits();
            checkApplicationStatus();
        }
    }, [id, router, session, status]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            if (name === 'availableDays') {
                // Handle multiple checkboxes for days
                const dayValue = e.target.value;

                setFormData(prev => {
                    const updatedDays = checked
                        ? [...prev.availableDays, dayValue]
                        : prev.availableDays.filter(day => day !== dayValue);

                    return {
                        ...prev,
                        availableDays: updatedDays
                    };
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked
                }));
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Updated file change handler to work with FileUploadSection
    const handleFileChange = (e, preparedFiles) => {
        // If preparedFiles is provided, use those (from the FileUploadSection component)
        if (preparedFiles) {
            setFormData(prev => ({
                ...prev,
                attachments: preparedFiles
            }));
            setFileUploadError(null);
        } else {
            // Handle direct change from input (fallback)
            const fileList = e.target.files ? Array.from(e.target.files) : [];
            setFormData(prev => ({
                ...prev,
                attachments: fileList.map(file => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    file: file
                }))
            }));
        }
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();
        
        // Validate form first
        if (!formData.coverLetter) {
            setError('Cover letter is required');
            return;
        }
        
        if (formData.bidType !== 'negotiable' && !formData.bidAmount) {
            setError('Bid amount is required');
            return;
        }
        
        // Check if user has enough credits
        if (credits < 1) {
            router.push('/credits?redirect=' + encodeURIComponent(`/jobs/${id}/apply`));
            return;
        }
        
        // Show credit confirmation modal
        setShowCreditModal(true);
    };

    const handleCancelCredit = () => {
        setShowCreditModal(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        setShowCreditModal(false);
        
        try {
            // Prepare application data
            const applicationData = {
                jobId: id,
                coverLetter: formData.coverLetter,
                bid: {
                    type: formData.bidType,
                    amount: formData.bidType !== 'negotiable' ? parseFloat(formData.bidAmount) : undefined,
                    estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
                    estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : undefined,
                    currency: job.budget?.currency || 'USD'
                },
                availability: {
                    canStartOn: formData.canStartOn || undefined,
                    availableDays: formData.availableDays,
                    preferredHours: {
                        start: formData.preferredHoursStart,
                        end: formData.preferredHoursEnd
                    }
                },
                additionalDetails: formData.additionalDetails || undefined,
                useCredit: true // Indicate that we're using a credit
            };

            // Submit application
            const response = await fetch(`/api/jobs/${id}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(applicationData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit application');
            }

            const applicationId = data.application._id;

            // Handle file uploads if there are attachments
            if (formData.attachments.length > 0) {
                try {
                    const uploadResponse = await fetch('/api/upload/application-cloudinary', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            applicationId,
                            files: formData.attachments
                        })
                    });

                    const uploadResult = await uploadResponse.json();

                    if (!uploadResponse.ok) {
                        console.warn('Some issues occurred while uploading attachments:', uploadResult.error);
                    } else if (uploadResult.partialSuccess) {
                        console.warn('Some files failed to upload:', uploadResult.failedUploads);
                    }
                } catch (uploadError) {
                    console.error('Error uploading attachments:', uploadError);
                }
            }

            // Deduct credit locally to update UI
            setCredits(prevCredits => prevCredits - 1);
            
            // Show success message
            setSuccessMessage('Your application has been submitted successfully!');

            // Redirect to job details after a delay
            setTimeout(() => {
                router.push(`/jobs/${id}?application=submitted`);
            }, 3000);

        } catch (err) {
            setError(err.message || 'An error occurred while submitting your application');
            console.error(err);
            setSubmitting(false);
        }
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
                                Application Error
                            </h1>
                            <p className="mt-2 text-lg text-gray-500">
                                {error}
                            </p>
                            <div className="mt-6">
                                <Link href={`/jobs/${id}`} className="text-base font-medium text-blue-600 hover:text-blue-500">
                                    Back to job details
                                    <span aria-hidden="true"> &rarr;</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 pb-12">
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                                Application Submitted!
                            </h1>
                            <p className="mt-2 text-lg text-gray-500">
                                {successMessage}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                1 credit has been deducted from your account.
                                You now have {credits} credits remaining.
                            </p>
                            <p className="mt-4 text-sm text-gray-500">
                                Redirecting you to the job details page...
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!job) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Credit status banner */}
                <div className={`mb-6 rounded-md ${credits >= 1 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} border p-4 flex justify-between items-center`}>
                    <div className="flex items-center">
                        <DollarSign className={`h-5 w-5 ${credits >= 1 ? 'text-blue-500' : 'text-amber-500'} mr-2`} />
                        <div>
                            <h3 className={`text-sm font-medium ${credits >= 1 ? 'text-blue-800' : 'text-amber-800'}`}>
                                Your Credit Balance: {credits}
                            </h3>
                            <p className="text-xs mt-1">
                                {credits >= 1 
                                    ? 'You have enough credits to apply for this job.'
                                    : 'You need 1 credit to apply for this job.'}
                            </p>
                        </div>
                    </div>
                    {credits < 1 && (
                        <Link
                            href="/credits"
                            className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded-md text-amber-800 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                            Purchase Credits
                        </Link>
                    )}
                </div>

                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            Apply for Job
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Submit your application for: {job.title}
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={`/jobs/${id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>

                {/* Job Summary */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Job Summary</h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                            <p>{job.description.substring(0, 200)}...</p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</h4>
                                <p className="mt-1 text-sm text-gray-900">{job.location.city}, {job.location.state}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</h4>
                                <p className="mt-1 text-sm text-gray-900">{job.category}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</h4>
                                <p className="mt-1 text-sm text-gray-900">
                                    {job.budget.type === 'fixed'
                                        ? `${job.budget.currency} ${job.budget.minAmount}`
                                        : job.budget.type === 'range'
                                            ? `${job.budget.currency} ${job.budget.minAmount} - ${job.budget.maxAmount}`
                                            : 'Negotiable'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link
                                href={`/jobs/${id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                View full job details
                            </Link>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmitClick} className="space-y-8">
                    {/* Existing form sections (Cover Letter, Bid, Availability, etc.) */}
                    {/* Cover Letter Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Cover Letter
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Introduce yourself and explain why you're a good fit for this job
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="col-span-1">
                                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                                        Your Message to the Customer*
                                    </label>
                                    <textarea
                                        id="coverLetter"
                                        name="coverLetter"
                                        rows={6}
                                        required
                                        value={formData.coverLetter}
                                        onChange={handleChange}
                                        placeholder="Describe  your relevant experience, skills, and why you're interested in this job. Be specific about how you can help with this project."
                                        className="mt-1 p-4 border focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bid Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Your Bid
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Provide details about your pricing and timeline
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <fieldset>
                                        <legend className="block text-sm font-medium text-gray-700">Bid Type*</legend>
                                        <div className="mt-4 space-y-4">
                                            <div className="flex items-center">
                                                <Input
                                                    id="bid-fixed"
                                                    name="bidType"
                                                    type="radio"
                                                    value="fixed"
                                                    checked={formData.bidType === 'fixed'}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor="bid-fixed" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Fixed Price
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <Input
                                                    id="bid-hourly"
                                                    name="bidType"
                                                    type="radio"
                                                    value="hourly"
                                                    checked={formData.bidType === 'hourly'}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor="bid-hourly" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Hourly Rate
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <Input
                                                    id="bid-negotiable"
                                                    name="bidType"
                                                    type="radio"
                                                    value="negotiable"
                                                    checked={formData.bidType === 'negotiable'}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor="bid-negotiable" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Negotiable
                                                </label>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>

                                {formData.bidType !== 'negotiable' && (
                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
                                            {formData.bidType === 'fixed' ? 'Total Bid Amount' : 'Hourly Rate'} ({job.budget?.currency || 'USD'})*
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <Input
                                                type="number"
                                                name="bidAmount"
                                                id="bidAmount"
                                                required={formData.bidType !== 'negotiable'}
                                                min="1"
                                                step="0.01"
                                                value={formData.bidAmount}
                                                onChange={handleChange}
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.bidType === 'hourly' && (
                                    <>
                                        <div className="col-span-3 sm:col-span-2">
                                            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
                                                Estimated Hours
                                            </label>
                                            <Input
                                                type="number"
                                                name="estimatedHours"
                                                id="estimatedHours"
                                                min="1"
                                                value={formData.estimatedHours}
                                                onChange={handleChange}
                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div className="col-span-3 sm:col-span-2">
                                            <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700">
                                                Estimated Days to Complete
                                            </label>
                                            <Input
                                                type="number"
                                                name="estimatedDays"
                                                id="estimatedDays"
                                                min="1"
                                                value={formData.estimatedDays}
                                                onChange={handleChange}
                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </>
                                )}

                                {formData.bidType === 'fixed' && (
                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700">
                                            Estimated Days to Complete
                                        </label>
                                        <Input
                                            type="number"
                                            name="estimatedDays"
                                            id="estimatedDays"
                                            min="1"
                                            value={formData.estimatedDays}
                                            onChange={handleChange}
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Submission with Credit Info */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Application Submission
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Applying for this job requires 1 credit
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="bg-blue-50 p-4 rounded-md mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <CreditCard className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Credit Information</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>
                                                Your application requires 1 credit. 
                                                You currently have {credits} {credits === 1 ? 'credit' : 'credits'}.
                                            </p>
                                            {credits < 1 && (
                                                <p className="mt-2">
                                                    <Link href="/credits" className="font-medium underline">
                                                        Purchase credits
                                                    </Link> to apply for this job.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting || credits < 1}
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                                        submitting || credits < 1 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : credits < 1 ? (
                                        'Need More Credits'
                                    ) : (
                                        'Submit Application (Use 1 Credit)'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Credit confirmation modal */}
            {showCreditModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Confirm Application Submission
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                You're about to submit your application for this job. This will use 1 credit from your account.
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Current balance: <span className="font-semibold">{credits} {credits === 1 ? 'credit' : 'credits'}</span>
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Balance after submission: <span className="font-semibold">{credits - 1} {credits - 1 === 1 ? 'credit' : 'credits'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Confirm and Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelCredit}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}