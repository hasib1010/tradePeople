"use client"
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { toast } from "react-toastify";
import {
  PlusCircle,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Trash2
} from "lucide-react";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dkfbbnsl0';
const CLOUDINARY_UPLOAD_PRESET = 'trade_people_attachments'; // Create this preset in your Cloudinary dashboard

export default function PostJobPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login?callbackUrl=/jobs/post");
    },
  });

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeStep, setActiveStep] = useState(1);
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
    country: "United Kingdom",
    startDate: "",
    endDate: "",
    durationValue: "",
    durationUnit: "days",
    isUrgent: false,
    attachments: []
  });
  const [cloudinaryLoaded, setCloudinaryLoaded] = useState(false);
  const cloudinaryScriptRef = useRef(null);

  useEffect(() => {
    if (!cloudinaryScriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      script.onload = () => {
        console.log('Cloudinary script loaded successfully');
        setCloudinaryLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Cloudinary script');
      };

      document.body.appendChild(script);
      cloudinaryScriptRef.current = script;

      return () => {
        if (cloudinaryScriptRef.current) {
          document.body.removeChild(cloudinaryScriptRef.current);
        }
      };
    }
  }, []);

  // Only allow customers to post jobs
  useEffect(() => {
    if (status === "authenticated" &&
      session.user.role !== "customer" &&
      session.user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load trade categories. Please try again.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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
      // Store the selected files for later upload
      const fileArray = Array.from(files);

      setFormData({
        ...formData,
        attachments: fileArray.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          file: file,
          uploading: false,
          progress: 0,
          url: null
        }))
      });

      console.log("Files selected:", fileArray.map(f => f.name));
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

  const nextStep = () => {
    const errors = validateStep(activeStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields");
      return;
    }

    setFieldErrors({});
    setError("");
    setActiveStep(activeStep + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setActiveStep(activeStep - 1);
    window.scrollTo(0, 0);
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.title || formData.title.trim() === '')
        errors.title = 'Job title is required';
      if (!formData.description || formData.description.trim() === '')
        errors.description = 'Job description is required';
      if (!formData.category || formData.category.trim() === '')
        errors.category = 'Please select a category';
    }

    if (step === 2) {
      if (!formData.city || formData.city.trim() === '')
        errors.city = 'City is required';
      if (!formData.state || formData.state.trim() === '')
        errors.state = 'State/Region is required';
      if (!formData.postalCode || formData.postalCode.trim() === '')
        errors.postalCode = 'Postal code is required';
    }

    return errors;
  };

  const validateAllSteps = () => {
    const step1Errors = validateStep(1);
    const step2Errors = validateStep(2);

    return { ...step1Errors, ...step2Errors };
  };

  // Direct upload to Cloudinary
  const uploadFileToCloudinary = async (file, jobId) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', `job-attachments/${jobId}`);

      const xhr = new XMLHttpRequest();

      // Setup progress monitoring
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress for ${file.name}: ${progress}%`);

          // Update progress for this specific file
          setFormData(prevData => ({
            ...prevData,
            attachments: prevData.attachments.map(attachment =>
              attachment.file === file
                ? { ...attachment, progress, uploading: true }
                : attachment
            )
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          console.log(`Upload complete for ${file.name}:`, response);

          resolve({
            name: file.name,
            url: response.secure_url,
            public_id: response.public_id,
            type: file.type,
            size: file.size,
            uploadedAt: new Date()
          });
        } else {
          reject(new Error(`Upload failed for ${file.name}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Network error during upload of ${file.name}`));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
      xhr.send(formData);
    });
  };

  // Upload all files and return metadata
  const uploadFilesToCloudinary = async (jobId) => {
    const fileUploads = formData.attachments.map(attachment =>
      uploadFileToCloudinary(attachment.file, jobId)
    );

    setUploadingFiles(true);

    try {
      const uploadedFiles = await Promise.all(fileUploads);
      setUploadingFiles(false);
      return uploadedFiles;
    } catch (error) {
      setUploadingFiles(false);
      throw error;
    }
  };

  // Update job with attachment info
  const saveAttachmentsToJob = async (jobId, attachments) => {
    try {
      const response = await fetch('/api/jobs/attachments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          attachments
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save attachments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving attachments to job:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Clear any previous field errors
    setFieldErrors({});

    // Validate all required fields
    const errors = validateAllSteps();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare job data in the correct format expected by the API
      const jobData = {
        // Basic job info
        title: formData.title,
        description: formData.description,
        category: formData.category,

        // Budget
        budgetType: formData.budgetType,
        minBudget: formData.budgetType !== 'negotiable' ? formData.minBudget : undefined,
        maxBudget: formData.budgetType === 'range' ? formData.maxBudget : undefined,
        currency: formData.currency,

        // Location
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country || "United States",

        // Timeline
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        durationValue: formData.durationValue || undefined,
        durationUnit: formData.durationUnit,

        // Flags and settings
        isUrgent: formData.isUrgent,
        requiredSkills: formData.requiredSkills || [],
        subCategories: formData.subCategories || []
      };

      console.log("Submitting job data:", jobData);

      // 1. First create the job
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API validation errors
        if (data.details) {
          const fieldErrors = {};
          Object.entries(data.details).forEach(([field, error]) => {
            // Convert nested paths like "location.city" to just "city"
            const fieldName = field.split('.').pop();
            fieldErrors[fieldName] = error.message;
          });

          setFieldErrors(fieldErrors);
          throw new Error(data.error || 'Validation failed');
        }

        throw new Error(data.error || 'Failed to post job');
      }

      const jobId = data.job._id;

      // 2. Handle file uploads if there are attachments
      if (formData.attachments && formData.attachments.length > 0) {
        try {
          toast.info("Uploading files to Cloudinary...");
          const uploadedFiles = await uploadFilesToCloudinary(jobId);
          console.log("Files uploaded to Cloudinary:", uploadedFiles);

          // 3. Save attachment info to job
          await saveAttachmentsToJob(jobId, uploadedFiles);
          toast.success(`Successfully uploaded ${uploadedFiles.length} attachments`);
        } catch (uploadError) {
          console.error("Error during file upload:", uploadError);
          toast.warning("Job posted, but there was an error uploading attachments.");
        }
      }

      // Show success message and redirect
      toast.success("Job posted successfully, redirecting....");
      router.push(`/jobs/${jobId}?status=created`);

    } catch (err) {
      console.error('Error posting job:', err);
      setError(err.message || 'An error occurred while posting the job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

  const openCloudinaryWidget = (e) => {
    e.preventDefault();

    if (!cloudinaryLoaded) {
      toast.error("Cloudinary widget is not loaded yet. Please try again in a moment.");
      console.log("Cloudinary script status:", cloudinaryLoaded ? "Loaded" : "Not loaded");
      return;
    }

    try {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          multiple: true,
          maxFiles: 5,
          resourceType: 'auto',
          sources: ['local', 'url', 'camera'],
          folder: 'job-attachments/temp',
          tags: ['job-attachment'],
          clientAllowedFormats: ['image', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
        },
        (error, result) => {
          if (error) {
            console.error('Upload widget error:', error);
            toast.error('Error opening upload widget');
            return;
          }

          if (result.event === 'success') {
            // Add the uploaded file to our attachments
            const newAttachment = {
              name: result.info.original_filename,
              url: result.info.secure_url,
              public_id: result.info.public_id,
              type: result.info.resource_type,
              size: result.info.bytes,
              uploadedAt: new Date()
            };

            setFormData(prevData => ({
              ...prevData,
              attachments: [...prevData.attachments, newAttachment]
            }));

            toast.success(`Uploaded: ${result.info.original_filename}`);
          }
        }
      );

      widget.open();
    } catch (error) {
      console.error("Error initializing Cloudinary widget:", error);
      toast.error("Failed to initialize upload widget. Please try again.");
    }
  };
  const renderProgressBar = () => {
    return (
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Step {activeStep} of 3
          </div>
          <div className="text-sm text-gray-500">
            {activeStep === 1 ? 'Job Details' : activeStep === 2 ? 'Location' : 'Timeline & Attachments'}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(activeStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (status === "loading" || loadingCategories) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl">
              Post a New Job
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Find the perfect tradesperson for your project
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/dashboard/customer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
          </div>
        </div>

        {renderProgressBar()}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
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
          {/* Step 1: Job Details */}
          {activeStep === 1 && (
            <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
              <div className="bg-blue-600 px-6 py-4 text-white">
                <div className="flex items-center">
                  <Briefcase className="h-6 w-6 mr-2" />
                  <h3 className="text-xl font-semibold">
                    Job Details
                  </h3>
                </div>
                <p className="mt-1 text-blue-100">
                  Provide basic information about your project
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Job Title */}
                <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <label htmlFor="title" className="block text-lg font-semibold text-gray-800">
                    Job Title*
                  </label>
                  <p className="text-sm text-gray-500 mb-2">What should tradespeople call your project?</p>
                  <Input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className={`mt-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg p-3 ${fieldErrors.title ? 'border-red-500' : ''
                      }`}
                    placeholder="e.g., Bathroom Renovation, Electrical Rewiring"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Job Description */}
                <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <label htmlFor="description" className="block text-lg font-semibold text-gray-800">
                    Job Description*
                  </label>
                  <p className="text-sm text-gray-500 mb-2">Describe your project in detail</p>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className={`mt-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg p-3 ${fieldErrors.description ? 'border-red-500' : ''
                      }`}
                    placeholder="Describe your project in detail. Include specific requirements, materials, timeline expectations, etc."
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                  )}
                </div>

                {/* Category */}
                <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <label htmlFor="category" className="block text-lg font-semibold text-gray-800">
                    Category*
                  </label>
                  <p className="text-sm text-gray-500 mb-2">Select the trade category for your job</p>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className={`mt-2 block w-full py-3 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${fieldErrors.category ? 'border-red-500' : ''
                      }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
                  )}
                  {categories.length === 0 && !loadingCategories && (
                    <p className="mt-2 text-sm text-red-500">
                      No categories available. Please contact support.
                    </p>
                  )}
                </div>

                {/* Budget */}
                <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-gray-700 mr-2" />
                    <label className="text-lg font-semibold text-gray-800">Budget</label>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">How much are you willing to spend?</p>

                  <div className="space-y-4">
                    <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Input
                        id="budget-negotiable"
                        name="budgetType"
                        type="radio"
                        value="negotiable"
                        checked={formData.budgetType === 'negotiable'}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="budget-negotiable" className="ml-3 block text-sm font-medium text-gray-800">
                        Negotiable
                      </label>
                    </div>

                    <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Input
                        id="budget-fixed"
                        name="budgetType"
                        type="radio"
                        value="fixed"
                        checked={formData.budgetType === 'fixed'}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="budget-fixed" className="ml-3 block text-sm font-medium text-gray-800">
                        Fixed Price
                      </label>
                    </div>

                    <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Input
                        id="budget-range"
                        name="budgetType"
                        type="radio"
                        value="range"
                        checked={formData.budgetType === 'range'}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="budget-range" className="ml-3 block text-sm font-medium text-gray-800">
                        Budget Range
                      </label>
                    </div>
                  </div>

                  {formData.budgetType === 'fixed' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <label htmlFor="minBudget" className="block text-sm font-medium text-gray-800">
                        Budget Amount ({formData.currency})
                      </label>
                      <div className="mt-2 relative rounded-lg shadow-sm">
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
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-lg p-3"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {formData.budgetType === 'range' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="minBudget" className="block text-sm font-medium text-gray-800">
                            Minimum Budget ({formData.currency})
                          </label>
                          <div className="mt-2 relative rounded-lg shadow-sm">
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
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-lg p-3"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="maxBudget" className="block text-sm font-medium text-gray-800">
                            Maximum Budget ({formData.currency})
                          </label>
                          <div className="mt-2 relative rounded-lg shadow-sm">
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
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-lg p-3"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Urgent Flag */}
                <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="flex items-center h-5">
                      <Input
                        id="isUrgent"
                        name="isUrgent"
                        type="checkbox"
                        checked={formData.isUrgent}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="isUrgent" className="font-medium text-gray-700 text-lg">
                        Mark as Urgent
                      </label>
                      <p className="text-gray-500 mt-1">
                        Urgent jobs receive higher visibility and priority attention from qualified tradespeople.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next: Location
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {activeStep === 2 && (
            <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
              <div className="bg-blue-600 px-6 py-4 text-white">
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 mr-2" />
                  <h3 className="text-xl font-semibold">
                    Job Location
                  </h3>
                </div>
                <p className="mt-1 text-blue-100">
                  Where will this project take place?
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {/* Street Address */}
                  <div className="mb-6">
                    <label htmlFor="address" className="block text-lg font-semibold text-gray-800">
                      Street Address
                    </label>
                    <Input
                      type="text"
                      name="address"
                      id="address"
                      placeholder="221B Baker Street"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-2 focus:ring-blue-600 focus:border-blue-600 w-full shadow-sm border-gray-300 rounded-md p-3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* City */}
                    <div>
                      <label htmlFor="city" className="block text-lg font-semibold text-gray-800">
                        City*
                      </label>
                      <Input
                        type="text"
                        name="city"
                        id="city"
                        required
                        placeholder="London"
                        value={formData.city}
                        onChange={handleChange}
                        className={`mt-2 focus:ring-blue-600 focus:border-blue-600 w-full shadow-sm border-gray-300 rounded-md p-3 ${fieldErrors.city ? 'border-red-500' : ''
                          }`}
                      />
                      {fieldErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
                      )}
                    </div>

                    {/* State/Province */}
                    <div>
                      <label htmlFor="state" className="block text-lg font-semibold text-gray-800">
                        County/Region*
                      </label>
                      <Input
                        type="text"
                        name="state"
                        id="state"
                        required
                        placeholder="Greater London"
                        value={formData.state}
                        onChange={handleChange}
                        className={`mt-2 focus:ring-blue-600 focus:border-blue-600 w-full shadow-sm border-gray-300 rounded-md p-3 ${fieldErrors.state ? 'border-red-500' : ''
                          }`}
                      />
                      {fieldErrors.state && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* ZIP / Postal Code */}
                    <div>
                      <label htmlFor="postalCode" className="block text-lg font-semibold text-gray-800">
                        Postcode*
                      </label>
                      <Input
                        type="text"
                        name="postalCode"
                        id="postalCode"
                        required
                        placeholder="EC1A 1BB"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className={`mt-2 focus:ring-blue-600 focus:border-blue-600 w-full shadow-sm border-gray-300 rounded-md p-3 ${fieldErrors.postalCode ? 'border-red-500' : ''
                          }`}
                      />
                      {fieldErrors.postalCode && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.postalCode}</p>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label htmlFor="country" className="block text-lg font-semibold text-gray-800">
                        Country
                      </label>
                      <Input
                        type="text"
                        name="country"
                        id="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="United Kingdom"
                        className="mt-2 focus:ring-blue-600 focus:border-blue-600 w-full shadow-sm border-gray-300 rounded-md p-3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next: Timeline & Attachments
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Timeline & Attachments */}
          {activeStep === 3 && (
            <div className="space-y-8">
              {/* Timeline Section */}
              <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
                <div className="bg-blue-600 px-6 py-4 text-white">
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 mr-2" />
                    <h3 className="text-xl font-semibold">
                      Project Timeline
                    </h3>
                  </div>
                  <p className="mt-1 text-blue-100">
                    When do you need this project completed?
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="startDate" className="block text-lg font-semibold text-gray-800">
                          Preferred Start Date
                        </label>
                        <Input
                          type="date"
                          name="startDate"
                          id="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg p-3"
                        />
                      </div>

                      <div>
                        <label htmlFor="endDate" className="block text-lg font-semibold text-gray-800">
                          Desired End Date
                        </label>
                        <Input
                          type="date"
                          name="endDate"
                          id="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                          className="mt-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg p-3"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="duration" className="block text-lg font-semibold text-gray-800">
                        Estimated Project Duration
                      </label>
                      <div className="mt-2 flex rounded-md shadow-sm">
                        <Input
                          type="number"
                          name="durationValue"
                          id="durationValue"
                          min="1"
                          value={formData.durationValue}
                          onChange={handleChange}
                          className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 p-3"
                          placeholder="Duration"
                        />
                        <select
                          id="durationUnit"
                          name="durationUnit"
                          value={formData.durationUnit}
                          onChange={handleChange}
                          className="focus:ring-blue-500 focus:border-blue-500 inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
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

              {/* Attachments Section */}
              <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
                <div className="bg-blue-600 px-6 py-4 text-white">
                  <div className="flex items-center">
                    <Upload className="h-6 w-6 mr-2" />
                    <h3 className="text-xl font-semibold">
                      Attachments (Optional)
                    </h3>
                  </div>
                  <p className="mt-1 text-blue-100">
                    Upload photos, plans, or documents related to your project
                  </p>
                </div>

                <div className="p-6">
                  <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
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
                        <div className="flex flex-col space-y-2">
                          <label
                            htmlFor="attachments"
                            className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                              <Upload className="h-4 w-4 mr-2" />
                              Select files from your device
                            </span>
                            <Input
                              id="attachments"
                              name="attachments"
                              type="file"
                              multiple
                              className="sr-only"
                              onChange={handleChange}
                            />
                          </label>

                          <span className="text-sm text-gray-600">or</span>

                          <button
                            type="button"
                            onClick={openCloudinaryWidget}
                            className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Use Cloudinary Upload Widget
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, PDF up to 10MB each
                        </p>
                      </div>
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Selected files:</h4>
                        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-gray-50">
                          {formData.attachments.map((attachment, index) => (
                            <li key={index} className="px-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                </svg>
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {attachment.name}
                                </span>
                              </div>
                              <div className="ml-4 flex items-center space-x-4">
                                {attachment.uploading ? (
                                  <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2.5">
                                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attachment.progress || 0}%` }}></div>
                                    </div>
                                    <span className="ml-2 text-xs text-gray-500">{attachment.progress || 0}%</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-gray-500 text-xs">
                                      {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Uploaded'}
                                    </div>
                                    <button
                                      type="button"
                                      className="text-red-600 hover:text-red-900"
                                      onClick={() => removeAttachment(index)}
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Ready to submit?</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Your job post will be reviewed and made available to qualified tradespeople in your area.
                            You'll be notified when professionals express interest in your project.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Back to Location
                    </button>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/customer')}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || uploadingFiles}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting || uploadingFiles ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {uploadingFiles ? 'Uploading Files...' : 'Posting Job...'}
                          </>
                        ) : (
                          <>
                            Post Job
                            <PlusCircle className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {uploadingFiles ? 'Uploading Files' : 'Posting Your Job'}
              </h3>
              <p className="text-gray-500 text-center mt-2">
                {uploadingFiles
                  ? 'Uploading your files to Cloudinary...'
                  : 'Please wait while we submit your job post...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}