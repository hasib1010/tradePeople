// src/app/jobs/[id]/edit/page.js
"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

export default function EditJobPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push(`/login?callbackUrl=/jobs/${id}/edit`);
        },
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        subCategories: [],
        requiredSkills: [],
        budgetType: "negotiable",
        minBudget: "",
        maxBudget: "",
        currency: "USD",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        startDate: "",
        endDate: "",
        durationValue: "",
        durationUnit: "days",
        isUrgent: false,
        status: "open",
        attachments: []
    });

    const categories = [
        'Plumbing', 'Electrical', 'Carpentry', 'Painting',
        'Roofing', 'HVAC', 'Landscaping', 'Masonry',
        'Flooring', 'Tiling', 'General Contracting', 'Drywall',
        'Cabinetry', 'Fencing', 'Decking', 'Concrete',
        'Window Installation', 'Door Installation', 'Appliance Repair',
        'Handyman Services', 'Cleaning Services', 'Moving Services',
        'Other'
    ];

    const skillOptions = [
        'Plumbing', 'Electrical', 'Carpentry', 'Painting',
        'Roofing', 'HVAC', 'Landscaping', 'Masonry',
        'Flooring', 'Tiling', 'Drywall Installation', 'Cabinetry',
        'Fencing', 'Decking', 'Concrete Work', 'Window Installation',
        'Door Installation', 'Appliance Repair', 'Handyman',
        'House Cleaning', 'Moving', 'Demolition', 'Home Renovation',
        'Power Washing', 'Gutter Cleaning', 'Furniture Assembly'
    ];

    const statusOptions = [
        'draft', 'open', 'in-progress', 'completed', 'canceled'
    ];

    // Fetch job data
    useEffect(() => {
        const fetchJobData = async () => {
            try {
                const response = await fetch(`/api/jobs/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch job details');
                }

                const jobData = await response.json();

                // Check if user has permission to edit this job
                if (status === "authenticated" &&
                    jobData.customer._id !== session.user.id &&
                    session.user.role !== "admin") {
                    router.push(`/jobs/${id}`);
                    return;
                }

                // Set form data from job
                setFormData({
                    title: jobData.title || "",
                    description: jobData.description || "",
                    category: jobData.category || "",
                    subCategories: jobData.subCategories || [],
                    requiredSkills: jobData.requiredSkills || [],
                    budgetType: jobData.budget?.type || "negotiable",
                    minBudget: jobData.budget?.minAmount?.toString() || "",
                    maxBudget: jobData.budget?.maxAmount?.toString() || "",
                    currency: jobData.budget?.currency || "USD",
                    address: jobData.location?.address || "",
                    city: jobData.location?.city || "",
                    state: jobData.location?.state || "",
                    postalCode: jobData.location?.postalCode || "",
                    country: jobData.location?.country || "United States",
                    startDate: jobData.timeline?.startDate ? new Date(jobData.timeline.startDate).toISOString().split('T')[0] : "",
                    endDate: jobData.timeline?.endDate ? new Date(jobData.timeline.endDate).toISOString().split('T')[0] : "",
                    durationValue: jobData.timeline?.expectedDuration?.value?.toString() || "",
                    durationUnit: jobData.timeline?.expectedDuration?.unit || "days",
                    isUrgent: jobData.isUrgent || false,
                    status: jobData.status || "open",
                    attachments: jobData.attachments || []
                });

                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching job data:', err);
                setError('Failed to load job. Please try again.');
                setIsLoading(false);
            }
        };

        if (status === "authenticated") {
            fetchJobData();
        }
    }, [id, session, status, router]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'checkbox') {
            setFormData({
                ...formData,
                [name]: checked
            });
            return;
        }

        if (type === 'file') {
            // Handle file attachments
            const fileList = Array.from(files);
            const newAttachments = fileList.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                file: file
            }));

            setFormData({
                ...formData,
                newAttachments // Store separately from existing attachments
            });
            return;
        }

        if (name === 'requiredSkills') {
            // Handle multi-select for skills
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData({
                ...formData,
                requiredSkills: selectedOptions
            });
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleRemoveAttachment = (index) => {
        const updatedAttachments = [...formData.attachments];
        updatedAttachments.splice(index, 1);
        setFormData({
            ...formData,
            attachments: updatedAttachments
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            // Prepare form data
            const jobData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subCategories: formData.subCategories,
                requiredSkills: formData.requiredSkills,
                budget: {
                    type: formData.budgetType,
                    minAmount: formData.budgetType !== 'negotiable' ? Number(formData.minBudget) : undefined,
                    maxAmount: formData.budgetType === 'range' ? Number(formData.maxBudget) : undefined,
                    currency: formData.currency
                },
                location: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.postalCode,
                    country: formData.country
                },
                timeline: {
                    startDate: formData.startDate || undefined,
                    endDate: formData.endDate || undefined,
                    expectedDuration: {
                        value: formData.durationValue ? Number(formData.durationValue) : undefined,
                        unit: formData.durationUnit
                    }
                },
                isUrgent: formData.isUrgent,
                status: formData.status
            };

            // Update job
            const response = await fetch(`/api/jobs/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jobData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update job');
            }

            // Handle file uploads if there are new attachments
            if (formData.newAttachments && formData.newAttachments.length > 0) {
                const uploadData = new FormData();

                formData.newAttachments.forEach(attachment => {
                    uploadData.append('files', attachment.file);
                });
                uploadData.append('jobId', id);

                const uploadResponse = await fetch('/api/upload/job-attachments', {
                    method: 'POST',
                    body: uploadData
                });

                if (!uploadResponse.ok) {
                    console.warn('Failed to upload new attachments');
                }
            }

            // Redirect to job details page
            router.push(`/jobs/${id}?status=updated`);

        } catch (err) {
            setError(err.message || 'An error occurred while updating the job');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            Edit Job
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Update your job posting details
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

                {error && (
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
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Job Details Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Job Details
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Update information about your project
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                        Job Title*
                                    </label>
                                    <Input
                                        type="text"
                                        name="title"
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        placeholder="e.g., Bathroom Renovation, Electrical Rewiring"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Job Description*
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        required
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Describe your project in detail. Include specific requirements, materials, timeline expectations, etc."
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                        Category*
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        required
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700">
                                        Required Skills
                                    </label>
                                    <select
                                        id="requiredSkills"
                                        name="requiredSkills"
                                        multiple
                                        value={formData.requiredSkills}
                                        onChange={handleChange}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        size={4}
                                    >
                                        {skillOptions.map((skill) => (
                                            <option key={skill} value={skill}>
                                                {skill}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Hold Ctrl/Cmd to select multiple skills
                                    </p>
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <fieldset>
                                        <legend className="block text-sm font-medium text-gray-700">Budget</legend>
                                        <div className="mt-4 space-y-4">
                                            <div className="flex items-center">
                                                <Input
                                                    id="budget-negotiable"
                                                    name="budgetType"
                                                    type="radio"
                                                    value="negotiable"
                                                    checked={formData.budgetType === 'negotiable'}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor="budget-negotiable" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Negotiable
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <Input
                                                    id="budget-fixed"
                                                    name="budgetType"
                                                    type="radio"
                                                    value="fixed"
                                                    checked={formData.budgetType === 'fixed'}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor="budget-fixed" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Fixed Price
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <Input
                                                    id="budget-range"
                                                    name="budgetType"
                                                    type="radio"
                                                    value="range"
                                                    checked={formData.budgetType === 'range'}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor="budget-range" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Budget Range
                                                </label>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    {formData.budgetType === 'fixed' && (
                                        <div>
                                            <label htmlFor="minBudget" className="block text-sm font-medium text-gray-700">
                                                Budget Amount ({formData.currency})
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    name="minBudget"
                                                    id="minBudget"
                                                    required
                                                    min="1"
                                                    value={formData.minBudget}
                                                    onChange={handleChange}
                                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.budgetType === 'range' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="minBudget" className="block text-sm font-medium text-gray-700">
                                                    Minimum Budget ({formData.currency})
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">$</span>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        name="minBudget"
                                                        id="minBudget"
                                                        required
                                                        min="1"
                                                        value={formData.minBudget}
                                                        onChange={handleChange}
                                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="maxBudget" className="block text-sm font-medium text-gray-700">
                                                    Maximum Budget ({formData.currency})
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">$</span>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        name="maxBudget"
                                                        id="maxBudget"
                                                        required
                                                        min={formData.minBudget || 1}
                                                        value={formData.maxBudget}
                                                        onChange={handleChange}
                                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-6">
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <Input
                                                id="isUrgent"
                                                name="isUrgent"
                                                type="checkbox"
                                                checked={formData.isUrgent}
                                                onChange={handleChange}
                                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="isUrgent" className="font-medium text-gray-700">
                                                Mark as Urgent
                                            </label>
                                            <p className="text-gray-500">
                                                Urgent jobs receive higher visibility and priority attention from qualified tradespeople.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Status - only for admin or if job is not in-progress */}
                                {(session?.user?.role === "admin" || formData.status !== "in-progress") && (
                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                            Job Status
                                        </label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Job Location
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Where will this project take place?
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                        Street Address*
                                    </label>
                                    <Input
                                        type="text"
                                        name="address"
                                        id="address"
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                        City*
                                    </label>
                                    <Input
                                        type="text"
                                        name="city"
                                        id="city"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                        State/Province*
                                    </label>
                                    <Input
                                        type="text"
                                        name="state"
                                        id="state"
                                        required
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                                        ZIP / Postal Code*
                                    </label>
                                    <Input
                                        type="text"
                                        name="postalCode"
                                        id="postalCode"
                                        required
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Project Timeline
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                When do you need this project completed?
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                        Preferred Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        name="startDate"
                                        id="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                        Desired End Date
                                    </label>
                                    <Input
                                        type="date"
                                        name="endDate"
                                        id="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        min={formData.startDate || undefined}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                        Estimated Project Duration
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <Input
                                            type="number"
                                            name="durationValue"
                                            id="durationValue"
                                            min="1"
                                            value={formData.durationValue}
                                            onChange={handleChange}
                                            className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                                            placeholder="Duration"
                                        />
                                        <select
                                            id="durationUnit"
                                            name="durationUnit"
                                            value={formData.durationUnit}
                                            onChange={handleChange}
                                            className="focus:ring-blue-500 focus:border-blue-500 inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                                        >
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                            <option value="weeks">Weeks</option>
                                            <option value="months">Months</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Existing Attachments Section */}
                    {formData.attachments && formData.attachments.length > 0 && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Existing Attachments
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Files you've already uploaded for this job
                                </p>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                                    {formData.attachments.map((attachment, index) => (
                                        <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                            <div className="w-0 flex-1 flex items-center">
                                                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                                </svg>
                                                <span className="ml-2 flex-1 w-0 truncate">
                                                    {attachment.name}
                                                </span>
                                            </div>
                                            <div className="ml-4 flex-shrink-0 flex">
                                                {attachment.url && (
                                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500 mr-4">
                                                        View
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttachment(index)}
                                                    className="font-medium text-red-600 hover:text-red-500"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* New Attachments Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {formData.attachments && formData.attachments.length > 0 ? 'Add More Attachments' : 'Attachments'} (Optional)
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Upload photos, plans, or documents related to your project
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="attachments"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                        >
                                            <span>Upload files</span>
                                            <Input
                                                id="attachments"
                                                name="attachments"
                                                type="file"
                                                multiple
                                                className="sr-only"
                                                onChange={handleChange}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, PDF up to 10MB each
                                    </p>
                                </div>
                            </div>

                            {formData.newAttachments && formData.newAttachments.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700">New files to upload:</h4>
                                    <ul className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-md">
                                        {formData.newAttachments.map((file, index) => (
                                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                <div className="w-0 flex-1 flex items-center">
                                                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="ml-2 flex-1 w-0 truncate">
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <div className="ml-4 flex-shrink-0 text-gray-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning for in-progress jobs */}
                    {formData.status === "in-progress" && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        This job is currently in progress. Some changes may impact the tradesperson working on this job.
                                        Consider communicating any significant changes directly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Link
                            href={`/jobs/${id}`}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}