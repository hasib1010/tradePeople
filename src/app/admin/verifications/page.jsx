"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ChevronLeft, 
  Shield, 
  FileText, 
  Clock, 
  Check, 
  X, 
  ExternalLink, 
  Search, 
  Filter 
} from "lucide-react";

export default function AdminVerificationsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/admin/verifications");
    },
  });

  // Check if user is admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      redirect(`/dashboard/${session?.user?.role || ""}`);
    }
  }, [status, session]);

  const [pendingTradespeople, setPendingTradespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [currentTab, setCurrentTab] = useState("pending");
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedTradesperson, setSelectedTradesperson] = useState(null);
  const [verificationNote, setVerificationNote] = useState("");
  
  // For pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTradespeople = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = `/api/admin/verifications?status=${currentTab}&page=${page}&search=${filterQuery}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("Failed to fetch verification data");
        }
        
        const data = await response.json();
        setPendingTradespeople(data.tradespeople);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching verification data:", err);
        setError("Failed to load verification data");
        setLoading(false);
      }
    };
    
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchTradespeople();
    }
  }, [status, session, currentTab, page, filterQuery]);

  const handleVerify = async (id, approved) => {
    try {
      setActionStatus({ loading: true });
      
      const response = await fetch(`/api/admin/verifications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved,
          note: verificationNote
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update verification status");
      }
      
      // Update the list
      setPendingTradespeople(pendingTradespeople.filter(person => person._id !== id));
      
      setActionStatus({
        success: true,
        message: `Tradesperson ${approved ? "verified" : "rejected"} successfully`
      });
      
      // Reset selected tradesperson
      setSelectedTradesperson(null);
      setVerificationNote("");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setActionStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error("Error updating verification status:", error);
      setActionStatus({
        success: false,
        message: error.message
      });
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page with new search
  };
  
  const openVerificationModal = (tradesperson) => {
    setSelectedTradesperson(tradesperson);
  };
  
  const closeVerificationModal = () => {
    setSelectedTradesperson(null);
    setVerificationNote("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/dashboard/admin" className="mr-2 text-blue-600 hover:text-blue-800">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Tradesperson Verifications</h1>
          </div>
          <p className="text-sm text-gray-600">
            Review and verify tradespeople credentials and information
          </p>
        </div>
        
        {/* Status messages */}
        {actionStatus?.success === true && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{actionStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {actionStatus?.success === false && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{actionStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs & Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => {setCurrentTab("pending"); setPage(1);}}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentTab === "pending"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Pending Verification
              </button>
              <button
                onClick={() => {setCurrentTab("verified"); setPage(1);}}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentTab === "verified"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => {setCurrentTab("rejected"); setPage(1);}}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentTab === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Rejected
              </button>
            </div>
            
            <div className="mt-3 sm:mt-0">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search name or email"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
          
          {/* Tradesperson list */}
          <div className="overflow-x-auto">
            {pendingTradespeople.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tradespeople to show</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {currentTab === "pending"
                    ? "There are no tradespeople waiting for verification."
                    : currentTab === "verified"
                    ? "There are no verified tradespeople."
                    : "There are no rejected tradespeople."}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tradesperson
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verifications
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingTradespeople.map((person) => (
                    <tr key={person._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={person.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {person.firstName} {person.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{person.email}</div>
                            <div className="text-sm text-gray-500">{person.phoneNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.businessName || "–"}</div>
                        <div className="text-sm text-gray-500">
                          {person.yearsOfExperience ? `${person.yearsOfExperience} years experience` : "No experience listed"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {person.skills && person.skills.length > 0 ? (
                            person.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No skills listed</span>
                          )}
                          {person.skills && person.skills.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{person.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(person.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className={`mr-2 flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                              person.certifications && person.certifications.filter(cert => cert.documentUrl).length > 0
                                ? "bg-green-400"
                                : "bg-gray-300"
                            }`}></div>
                            <span>
                              {person.certifications && person.certifications.filter(cert => cert.documentUrl).length} certifications
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-900 mt-1">
                          <div className="flex items-center">
                            <div className={`mr-2 flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                              person.insurance && person.insurance.documentUrl
                                ? "bg-green-400"
                                : "bg-gray-300"
                            }`}></div>
                            <span>
                              {person.insurance && person.insurance.documentUrl
                                ? "Insurance document uploaded"
                                : "No insurance document"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/admin/tradespeople/${person._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Profile
                          </Link>
                          {currentTab === "pending" && (
                            <button
                              onClick={() => openVerificationModal(person)}
                              className="text-green-600 hover:text-green-900 ml-4"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(page + 1, totalPages))}
                    disabled={page === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{pendingTradespeople.length}</span> results - Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(page - 1, 1))}
                        disabled={page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          page === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNumber = i + 1;
                        // Only show current page, first, last, and adjacent pages
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          Math.abs(pageNumber - page) <= 1
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              aria-current={page === pageNumber ? "page" : undefined}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pageNumber
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                        // Add ellipsis if needed
                        if (
                          (pageNumber === 2 && page > 3) ||
                          (pageNumber === totalPages - 1 && page < totalPages - 2)
                        ) {
                          return (
                            <span
                              key={`ellipsis-${pageNumber}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      
                      <button
                        onClick={() => setPage(Math.min(page + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronLeft className="h-5 w-5 transform rotate-180" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Verification Modal */}
      {selectedTradesperson && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeVerificationModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Verify Tradesperson
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You are about to verify {selectedTradesperson.firstName} {selectedTradesperson.lastName}. 
                        This will allow them to apply for jobs on the platform.
                      </p>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Verification Note (Optional)</h4>
                        <textarea
                          rows={3}
                          value={verificationNote}
                          onChange={(e) => setVerificationNote(e.target.value)}
                          placeholder="Add notes about this verification decision..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleVerify(selectedTradesperson._id, true)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(selectedTradesperson._id, false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={closeVerificationModal}
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