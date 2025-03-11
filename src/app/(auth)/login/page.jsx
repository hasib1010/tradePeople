"use client"
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const verificationSuccess = searchParams.get("verified");
  const pendingVerification = searchParams.get("pending");
  const email = searchParams.get("email") || "";

  const [userEmail, setUserEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    if (message) {
      toast.info(message);
    }
    if (verificationSuccess === "true") {
      toast.success("Email verified successfully! You can now log in.");
    }
    if (pendingVerification === "true" && email) {
      setNeedsVerification(true);
      setUserEmail(email);
      toast.warning("Please verify your email before logging in.");
    }
  }, [message, verificationSuccess, pendingVerification, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: userEmail,
        password
      });

      if (res.error) {
        // Check if error is about email verification
        if (res.error.includes("verify your email")) {
          setNeedsVerification(true);
          setError(res.error);
        } else {
          setError(res.error || "Invalid credentials");
        }
        setLoading(false);
        return;
      }

      if (!res.error) {
        toast.success("Login successful, redirecting...")
      }

      // Check user role from token or API to determine the correct dashboard
      // For now, redirect to the tradesperson dashboard
      window.location.href = "/dashboard/tradesperson";
    } catch (err) {
      setError("An error occurred during sign in");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(data.message || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {error && !needsVerification && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {needsVerification && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="mb-2">Please verify your email before logging in.</p>
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Resend verification email to {userEmail}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {loading ? (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white text-xl font-bold">Processing...</span>
          </div>
        ) : null}

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-500 hover:text-blue-700">
              Register
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Didn't receive verification email?{" "}
            <Link href="/verify-email" className="text-blue-500 hover:text-blue-700">
              Resend
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}