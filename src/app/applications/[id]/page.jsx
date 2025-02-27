// src/app/applications/[id]/page.jsx
"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import CompleteJobModal from '@/components/jobs/CompleteJobModal';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [showCompleteJobModal, setShowCompleteJobModal] = useState(false);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const response = await fetch(`/api/applications/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Application not found');
          }
          throw new Error('Failed to load application details');
        }
        
        const data = await response.json();
        setApplication(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchApplicationDetails();
    }
  }, [id, status]);

  const isJobOwner = session?.user?.id === application?.job?.customer?._id?.toString();
  const isApplicant = session?.user?.id === application?.tradesperson?._id?.toString();
  
  const updateApplicationStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }
      
      const data = await response.json();
      setApplication(data.application);
      
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Function to mark job as in progress (when an application is accepted)
  const markJobInProgress = async () => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/jobs/${application.job._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'in-progress',
          selectedTradesperson: application.tradesperson._id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job status');
      }
      
      // Update the local application state with the updated job status
      const updatedApplication = { ...application };
      updatedApplication.job.status = 'in-progress';
      setApplication(updatedApplication);
      
    } catch (err) {
      console.error('Error updating job status:', err);
      alert('Failed to update job status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNotes = async () => {
    if (!notes.trim()) return;
    
    try {
      const notesData = {};
      if (isJobOwner) {
        notesData.customer = notes;
      } else if (isApplicant) {
        notesData.tradesperson = notes;
      }

      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          notes: notesData 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add notes');
      }
      
      const data = await response.json();
      setApplication(data.application);
      setNotes('');
      setShowNotesForm(false);
      
    } catch (err) {
      console.error('Error adding notes:', err);
      alert('Failed to add notes: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobStatusBadgeClasses = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push(`/login?callbackUrl=/applications/${id}`);
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Application Not Found
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                {error}
              </p>
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

  if (!application) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back button and header */}
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
            Application Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Submitted on {formatDate(application.submittedAt)}
          </p>
          
          <div className="mt-2 flex space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(application.status)}`}>
              Application: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
            
            {application.job && application.job.status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobStatusBadgeClasses(application.job.status)}`}>
                Job: {application.job.status.charAt(0).toUpperCase() + application.job.status.slice(1)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main content */}
          <div className="lg:col-span-8">
            {/* Job details */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Job Details</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {application.job.title}
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {application.job.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Category</h4>
                      <p className="mt-1 text-sm text-gray-900">{application.job.category}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Budget</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {application.job.budget.type === 'fixed'
                          ? `${application.job.budget.currency} ${application.job.budget.minAmount}`
                          : application.job.budget.type === 'range'
                            ? `${application.job.budget.currency} ${application.job.budget.minAmount} - ${application.job.budget.maxAmount}`
                            : 'Negotiable'}
                      </p>
                    </div>
                  </div>
                  <Link href={`/jobs/${application.job._id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View full job details
                  </Link>
                </div>
              </div>
            </div>

            {/* Application details */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Application Details</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  {/* Cover letter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Cover Letter</h3>
                    <div className="mt-2 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.coverLetter}</p>
                    </div>
                  </div>

                  {/* Bid details */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bid Details</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Bid Type</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{application.bid.type}</dd>
                      </div>
                      {application.bid.type !== 'negotiable' && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">
                            {application.bid.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {application.bid.currency} {application.bid.amount}
                          </dd>
                        </div>
                      )}
                      {application.bid.estimatedDays && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Estimated Days</dt>
                          <dd className="mt-1 text-sm text-gray-900">{application.bid.estimatedDays} days</dd>
                        </div>
                      )}
                      {application.bid.estimatedHours && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Estimated Hours</dt>
                          <dd className="mt-1 text-sm text-gray-900">{application.bid.estimatedHours} hours</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Availability */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Availability</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      {application.availability.canStartOn && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Available From</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(application.availability.canStartOn)}</dd>
                        </div>
                      )}
                      {application.availability.availableDays && application.availability.availableDays.length > 0 && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Available Days</dt>
                          <dd className="mt-1 text-sm text-gray-900">{application.availability.availableDays.join(', ')}</dd>
                        </div>
                      )}
                      {application.availability.preferredHours && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Preferred Hours</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {application.availability.preferredHours.start} to {application.availability.preferredHours.end}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Additional details */}
                  {application.additionalDetails && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Additional Details</h3>
                      <div className="mt-2 p-4 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.additionalDetails}</p>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {application.attachments && application.attachments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Attachments</h3>
                      <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                        {application.attachments.map((attachment, index) => (
                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">
                                {attachment.name}
                              </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500">
                                Download
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Communication</h2>
                <button 
                  onClick={() => setShowNotesForm(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Note
                </button>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {showNotesForm && (
                  <div className="mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      {isJobOwner ? 'Add note to the applicant' : 'Add note to the job owner'}
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        className="shadow-sm p-4 border focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder='write here'
                      />
                    </div>
                    <div className="mt-2 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotesForm(false);
                          setNotes('');
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addNotes}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Display notes */}
                <div className="space-y-6">
                  {application.notes?.customer && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={application.job.customer?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                            alt={application.job.customer?.firstName} 
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">
                            {application.job.customer?.firstName} {application.job.customer?.lastName} (Customer)
                          </p>
                          <div className="mt-1 text-sm text-blue-700">
                            <p>{application.notes.customer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {application.notes?.tradesperson && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={application.tradesperson?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                            alt={application.tradesperson?.firstName} 
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            {application.tradesperson?.firstName} {application.tradesperson?.lastName} (Tradesperson)
                          </p>
                          <div className="mt-1 text-sm text-green-700">
                            <p>{application.notes.tradesperson}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!application.notes?.customer && !application.notes?.tradesperson && (
                    <p className="text-sm text-gray-500 italic">No communication notes yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            {/* User info */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {isJobOwner ? 'Applicant Information' : 'Customer Information'}
                </h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {isJobOwner ? (
                  // Show tradesperson info
                  <div className="flex flex-col items-center">
                    <img 
                      className="h-24 w-24 rounded-full" 
                      src={application.tradesperson?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                      alt={application.tradesperson?.firstName} 
                    />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {application.tradesperson?.firstName} {application.tradesperson?.lastName}
                    </h3>
                    {/* Only show contact details if application is accepted */}
                    {application.status === 'accepted' ? (
                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <p>
                          <span className="font-medium">Email:</span> {application.tradesperson?.email}
                        </p>
                        {application.tradesperson?.phoneNumber && (
                          <p>
                            <span className="font-medium">Phone:</span> {application.tradesperson?.phoneNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        Contact details will be available once you accept this application.
                      </p>
                    )}
                    <Link href={`/tradespeople/${application.tradesperson?._id}`} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500">
                      View full profile
                    </Link>
                  </div>
                ) : (
                  // Show customer info
                  <div className="flex flex-col items-center">
                    <img 
                      className="h-24 w-24 rounded-full" 
                      src={application.job.customer?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                      alt={application.job.customer?.firstName} 
                    />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {application.job.customer?.firstName} {application.job.customer?.lastName}
                    </h3>
                    {/* Only show contact details if application is accepted */}
                    {application.status === 'accepted' ? (
                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <p>
                          <span className="font-medium">Email:</span> {application.job.customer?.email}
                        </p>
                        {application.job.customer?.phoneNumber && (
                          <p>
                            <span className="font-medium">Phone:</span> {application.job.customer?.phoneNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        Contact details will be available once your application is accepted.
                      </p>
                    )}
                    <Link href={`/customers/${application.job.customer?._id}`} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500">
                      View profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Application actions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Actions</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {isJobOwner && application.status === 'pending' && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('shortlisted')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Shortlist Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('accepted')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Accept Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('rejected')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Reject Application'}
                    </button>
                  </div>
                )}

                {isJobOwner && application.status === 'shortlisted' && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('accepted')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Accept Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('rejected')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Reject Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('pending')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Move Back to Pending'}
                    </button>
                  </div>
                )}

                {isApplicant && (application.status === 'pending' || application.status === 'shortlisted') && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => updateApplicationStatus('withdrawn')}
                      disabled={updatingStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {updatingStatus ? 'Processing...' : 'Withdraw Application'}
                    </button>
                  </div>
                )}

                {/* Accepted application state */}
                {application.status === 'accepted' && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-green-50 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            This application has been accepted. 
                          </p>
                          <p className="mt-2 text-sm text-green-700">
                            {isJobOwner ? 
                              "You can now communicate directly with the tradesperson to coordinate the job." :
                              "You can now communicate directly with the customer to coordinate the job."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mark job as in-progress button (only for job owner when job is still in 'open' status) */}
                    {isJobOwner && application.job.status === 'open' && (
                      <button
                        type="button"
                        onClick={markJobInProgress}
                        disabled={updatingStatus}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {updatingStatus ? 'Processing...' : 'Start Job'}
                      </button>
                    )}
                    
                    {/* Complete job button (only for job owner when job is in 'in-progress' status) */}
                    {isJobOwner && application.job.status === 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => setShowCompleteJobModal(true)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Mark Job as Complete
                      </button>
                    )}
                  </div>
                )}

                {application.status === 'rejected' && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          This application has been rejected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {application.status === 'withdrawn' && (
                  <div className="rounded-md bg-gray-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">
                          This application has been withdrawn.
                        </p>
                        {application.withdrawalReason && (
                          <p className="mt-2 text-sm text-gray-700">
                            Reason: {application.withdrawalReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Related links */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <ul className="space-y-3">
                  <li>
                    <Link href={`/jobs/${application.job._id}`} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      View Job Details
                    </Link>
                  </li>
                  {isJobOwner && (
                    <li>
                      <Link href={`/jobs/${application.job._id}/applications`} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                        <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        View All Applications
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link href="/messages" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                      </svg>
                      Messages
                    </Link>
                  </li>
                  <li>
                    <Link href={`/dashboard/${isJobOwner ? 'customer' : 'tradesperson'}`} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <svg className="mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Back to Dashboard
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Complete Job Modal */}
      {showCompleteJobModal && (
        <CompleteJobModal
          isOpen={showCompleteJobModal}
          closeModal={() => setShowCompleteJobModal(false)}
          jobId={application.job._id}
          jobTitle={application.job.title}
          budget={application.job.budget}
        />
      )}
    </div>
  );
}