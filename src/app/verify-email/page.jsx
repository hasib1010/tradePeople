"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("idle"); // idle, verifying, success, error
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState(null); // To track if user is tradesperson or customer
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token) => {
    try {
      setStatus("verifying");
      setMessage("Verifying your email...");
      
      // Use POST method with token in body
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Your email has been verified successfully.");
        setUserRole(data.role || null);
        
        // Set redirect timeout - longer for tradespeople to read admin verification info
        const redirectDelay = data.role === 'tradesperson' ? 8000 : 3000;
        
        // Redirect to login after delay
        setTimeout(() => {
          router.push("/login?verified=true");
        }, redirectDelay);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to verify email.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again later.");
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }
    
    try {
      setStatus("verifying");
      setMessage("Sending verification email...");
      
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Verification email has been resent. Please check your inbox.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to resend verification email.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again later.");
    }
  };

  // If no token is provided, show the resend form
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
          
          <p className="text-gray-600 mb-6">
            Enter your email address below to receive a new verification link.
          </p>
          
          {status === "success" && (
            <div className="bg-green-50 p-4 rounded-md text-green-800 mb-6">
              {message}
            </div>
          )}
          
          {status === "error" && (
            <div className="bg-red-50 p-4 rounded-md text-red-800 mb-6">
              {message}
            </div>
          )}
          
          <form onSubmit={handleResendVerification}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-md"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={status === "verifying"}
              className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {status === "verifying" ? "Sending..." : "Resend Verification Email"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If a token is provided, show verification status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Email Verification</h1>
        
        {status === "idle" && (
          <p className="text-gray-600">Starting verification process...</p>
        )}
        
        {status === "verifying" && (
          <div className="py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">{message}</p>
          </div>
        )}
        
        {status === "success" && (
          <div>
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p className="mt-4 text-green-600 font-medium">{message}</p>
            
            {userRole === "tradesperson" && (
              <div className="mt-4 bg-blue-50 p-4 rounded-md text-blue-800">
                <h3 className="font-medium">Admin Verification Required</h3>
                <p className="mt-2 text-sm">
                  As a tradesperson, your account needs additional verification by our admin team.
                  This typically takes 1-2 business days. You'll receive an email once your account is approved.
                </p>
              </div>
            )}
            
            <p className="mt-4 text-gray-500">Redirecting to login page...</p>
          </div>
        )}
        
        {status === "error" && (
          <div>
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="mt-4 text-red-600">{message}</p>
            
            <div className="mt-6">
              <p className="text-gray-600 mb-4">
                If your verification link expired, enter your email to receive a new one:
              </p>
              
              <form onSubmit={handleResendVerification} className="mt-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
                  required
                />
                
                <button
                  type="submit"
                  disabled={status === "verifying"}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {status === "verifying" ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            </div>
            
            <div className="mt-6">
              <Link href="/login" className="text-blue-600 hover:text-blue-800">
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}