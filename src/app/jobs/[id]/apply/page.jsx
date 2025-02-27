"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import FileUploadSection from "@/components/FileUploadSection";
import { CreditCard, AlertTriangle, CheckCircle, X, DollarSign } from "lucide-react";

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
    const [successMessage, setSuccessMessage] = useState("");
    const [credits, setCredits] = useState(0);
    const [showCreditModal, setShowCreditModal] = useState(false);

    const [formData, setFormData] = useState({
        coverLetter: "",
        bidType: "fixed",
        bidAmount: "",
        estimatedHours: "",
        estimatedDays: "",
        canStartOn: "",
        availableDays: [],
        preferredHoursStart: "09:00",
        preferredHoursEnd: "17:00",
        additionalDetails: "",
        attachments: [],
    });

    const availableDaysOptions = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    useEffect(() => {
        const fetchJobDataAndCredits = async () => {
            try {
                const jobResponse = await fetch(`/api/jobs/${id}`);
                if (!jobResponse.ok) {
                    if (jobResponse.status === 404) throw new Error("Job not found");
                    throw new Error("Failed to load job details");
                }
                const jobData = await jobResponse.json();
                setJob(jobData);

                if (jobData.status !== "open") {
                    setError("This job is no longer accepting applications");
                    setTimeout(() => router.push(`/jobs/${id}`), 3000);
                    return;
                }

                if (jobData.budget?.type === "fixed" && jobData.budget?.minAmount) {
                    setFormData((prev) => ({
                        ...prev,
                        bidAmount: jobData.budget.minAmount.toString(),
                    }));
                }

                const creditsResponse = await fetch("/api/credits");
                if (creditsResponse.ok) {
                    const creditsData = await creditsResponse.json();
                    setCredits(creditsData.available || 0);
                } else {
                    console.error("Failed to fetch credits data");
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        const checkApplicationStatus = async () => {
            try {
                const response = await fetch(`/api/jobs/${id}/applications/check`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.hasApplied) {
                        setError("You have already applied to this job");
                        setTimeout(() => router.push(`/jobs/${id}`), 3000);
                    }
                }
            } catch (err) {
                console.error("Error checking application status:", err);
            }
        };

        if (status === "authenticated") {
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
        if (type === "checkbox") {
            if (name === "availableDays") {
                setFormData((prev) => ({
                    ...prev,
                    availableDays: checked
                        ? [...prev.availableDays, value]
                        : prev.availableDays.filter((day) => day !== value),
                }));
            } else {
                setFormData((prev) => ({ ...prev, [name]: checked }));
            }
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, preparedFiles) => {
        const files = preparedFiles || Array.from(e.target.files || []).map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            file,
        }));
        setFormData((prev) => ({ ...prev, attachments: files }));
        setFileUploadError(null);
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();
        if (!formData.coverLetter) {
            setError("Cover letter is required");
            return;
        }
        if (formData.bidType !== "negotiable" && !formData.bidAmount) {
            setError("Bid amount is required");
            return;
        }
        if (credits < (job?.creditCost || 1)) {
            router.push(`/credits?redirect=${encodeURIComponent(`/jobs/${id}/apply`)}`);
            return;
        }
        setShowCreditModal(true);
    };

    // In JobApplicationPage
    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        setShowCreditModal(false);

        try {
            const creditCost = job?.creditCost || 1;
            const applicationData = {
                jobId: id,
                coverLetter: formData.coverLetter,
                bid: {
                    type: formData.bidType,
                    amount: formData.bidType !== "negotiable" ? parseFloat(formData.bidAmount) : undefined,
                    estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
                    estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : undefined,
                    currency: job.budget?.currency || "USD",
                },
                availability: {
                    canStartOn: formData.canStartOn || undefined,
                    availableDays: formData.availableDays,
                    preferredHours: {
                        start: formData.preferredHoursStart,
                        end: formData.preferredHoursEnd,
                    },
                },
                additionalDetails: formData.additionalDetails || undefined,
                useCredit: true,
            };

            const response = await fetch(`/api/jobs/${id}/applications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(applicationData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to submit application");

            const applicationId = data.application._id;
            if (formData.attachments.length > 0) {
                try {
                    const uploadResponse = await fetch("/api/upload/application-cloudinary", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ applicationId, files: formData.attachments }),
                    });
                    const uploadResult = await uploadResponse.json();
                    if (!uploadResponse.ok) console.warn("Attachment upload issues:", uploadResult.error);
                } catch (uploadError) {
                    console.error("Error uploading attachments:", uploadError);
                }
            }

            setCredits((prev) => prev - creditCost);
            setSuccessMessage(
                `Application submitted successfully! ${creditCost} credit${creditCost > 1 ? "s" : ""} deducted. Check your activity feed for updates.`
            );
            setTimeout(() => router.push("/dashboard/tradesperson/activity"), 3000);
        } catch (err) {
            setError(err.message || "An error occurred while submitting your application");
            console.error(err);
            setSubmitting(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 pb-12">
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                        <h1 className="mt-4 text-3xl font-bold text-gray-900">Application Error</h1>
                        <p className="mt-2 text-lg text-gray-600">{error}</p>
                        <Link href={`/jobs/${id}`} className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Back to Job Details
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 pb-12">
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h1 className="mt-4 text-3xl font-bold text-gray-900">Application Submitted!</h1>
                        <p className="mt-2 text-lg text-gray-600">{successMessage}</p>
                        <p className="mt-2 text-sm text-gray-500">Remaining credits: {credits}</p>
                        <p className="mt-4 text-sm text-gray-500">Redirecting to job details...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!job) return null;

    const creditCost = job.creditCost || 1;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Credit Status Banner */}
                <div className={`mb-8 rounded-lg border p-6 ${credits >= creditCost ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <DollarSign className={`h-6 w-6 ${credits >= creditCost ? "text-green-500" : "text-yellow-500"} mr-3`} />
                            <div>
                                <h3 className={`text-lg font-semibold ${credits >= creditCost ? "text-green-800" : "text-yellow-800"}`}>
                                    Credit Balance: {credits}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    This job requires <span className="font-medium">{creditCost}</span> credit{creditCost > 1 ? "s" : ""} to apply.
                                    {credits >= creditCost ? " You’re ready to apply!" : " You need more credits."}
                                </p>
                            </div>
                        </div>
                        {credits < creditCost && (
                            <Link
                                href="/credits"
                                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                                Get Credits
                            </Link>
                        )}
                    </div>
                </div>

                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Apply for: {job.title}</h1>
                        <p className="mt-2 text-sm text-gray-600">Submit your proposal to the customer</p>
                    </div>
                    <Link
                        href={`/jobs/${id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>

                {/* Job Summary */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="px-6 py-5">
                        <h3 className="text-lg font-semibold text-gray-900">Job Summary</h3>
                        <p className="mt-2 text-sm text-gray-600">{job.description.substring(0, 200)}...</p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Location</span>
                                <p className="mt-1 text-sm text-gray-900">{job.location.city}, {job.location.state}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
                                <p className="mt-1 text-sm text-gray-900">{job.category}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Budget</span>
                                <p className="mt-1 text-sm text-gray-900">
                                    {job.budget.type === "fixed"
                                        ? `${job.budget.currency} ${job.budget.minAmount}`
                                        : job.budget.type === "range"
                                            ? `${job.budget.currency} ${job.budget.minAmount} - ${job.budget.maxAmount}`
                                            : "Negotiable"}
                                </p>
                            </div>
                        </div>
                        <Link href={`/jobs/${id}`} className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500">
                            View Full Details
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmitClick} className="space-y-8">
                    {/* Cover Letter */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-900">Cover Letter</h3>
                            <p className="mt-1 text-sm text-gray-600">Why you’re the right fit for this job</p>
                            <textarea
                                id="coverLetter"
                                name="coverLetter"
                                rows={6}
                                required
                                value={formData.coverLetter}
                                onChange={handleChange}
                                placeholder="Describe your experience, skills, and interest in this project..."
                                className="mt-3 w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Bid Section */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-900">Your Bid</h3>
                            <p className="mt-1 text-sm text-gray-600">Pricing and timeline details</p>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <fieldset>
                                    <legend className="text-sm font-medium text-gray-700">Bid Type</legend>
                                    <div className="mt-2 space-y-2">
                                        {["fixed", "hourly", "negotiable"].map((type) => (
                                            <div key={type} className="flex items-center">
                                                <Input
                                                    id={`bid-${type}`}
                                                    name="bidType"
                                                    type="radio"
                                                    value={type}
                                                    checked={formData.bidType === type}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor={`bid-${type}`} className="ml-2 text-sm text-gray-700">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>

                                {formData.bidType !== "negotiable" && (
                                    <div>
                                        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
                                            {formData.bidType === "fixed" ? "Total Bid" : "Hourly Rate"} ({job.budget?.currency || "USD"})
                                        </label>
                                        <div className="mt-1 relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                            <Input
                                                type="number"
                                                name="bidAmount"
                                                id="bidAmount"
                                                required={formData.bidType !== "negotiable"}
                                                min="1"
                                                step="0.01"
                                                value={formData.bidAmount}
                                                onChange={handleChange}
                                                className="pl-7 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.bidType === "hourly" && (
                                    <>
                                        <div>
                                            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                                            <Input
                                                type="number"
                                                name="estimatedHours"
                                                id="estimatedHours"
                                                min="1"
                                                value={formData.estimatedHours}
                                                onChange={handleChange}
                                                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700">Estimated Days</label>
                                            <Input
                                                type="number"
                                                name="estimatedDays"
                                                id="estimatedDays"
                                                min="1"
                                                value={formData.estimatedDays}
                                                onChange={handleChange}
                                                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </>
                                )}

                                {formData.bidType === "fixed" && (
                                    <div>
                                        <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700">Estimated Days</label>
                                        <Input
                                            type="number"
                                            name="estimatedDays"
                                            id="estimatedDays"
                                            min="1"
                                            value={formData.estimatedDays}
                                            onChange={handleChange}
                                            className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Application Submission */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-900">Submit Application</h3>
                            <p className="mt-1 text-sm text-gray-600">Requires {creditCost} credit{creditCost > 1 ? "s" : ""}</p>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting || credits < creditCost}
                                    className={`inline-flex items-center px-6 py-3 rounded-md text-white font-medium ${submitting || credits < creditCost
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        }`}
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : credits < creditCost ? (
                                        `Need ${creditCost} Credit${creditCost > 1 ? "s" : ""}`
                                    ) : (
                                        `Apply (${creditCost} Credit${creditCost > 1 ? "s" : ""})`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Credit Confirmation Modal */}
                {showCreditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center mb-4">
                                <CreditCard className="h-8 w-8 text-blue-500 mr-3" />
                                <h3 className="text-xl font-semibold text-gray-900">Confirm Application</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Submitting this application will deduct <span className="font-medium">{creditCost}</span> credit{creditCost > 1 ? "s" : ""} from your balance.
                            </p>
                            <div className="bg-gray-50 p-4 rounded-md mb-6">
                                <p className="text-sm text-gray-700">Current Balance: <span className="font-semibold">{credits}</span></p>
                                <p className="text-sm text-gray-700">After Submission: <span className="font-semibold">{credits - creditCost}</span></p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowCreditModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}