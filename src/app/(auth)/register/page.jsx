"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    location: {
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const validatePasswords = () => {
    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handlePasswordChange = (e) => {
    handleChange(e);
   
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validatePasswords();
    setIsLoading(true);

    setError("");

    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard/customer");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your customer account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/register-tradesperson" className="font-medium text-blue-600 hover:text-blue-500">
            register as a tradesperson
          </Link>
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <Input name="firstName" type="text" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <Input name="lastName" type="text" required value={formData.lastName} onChange={handleChange} />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <Input name="email" type="email" required value={formData.email} onChange={handleChange} />

          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <Input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange} />

          <label className="block text-sm font-medium text-gray-700">Address</label>
          <Input name="location.address" type="text" required value={formData.location.address} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <Input name="location.city" type="text" required value={formData.location.city} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <Input name="location.state" type="text" required value={formData.location.state} onChange={handleChange} />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">Postal Code</label>
          <Input name="location.postalCode" type="text" required value={formData.location.postalCode} onChange={handleChange} />

          <label className="block text-sm font-medium text-gray-700">Password</label>
          <Input name="password" type="password" required minLength={8} value={formData.password} onChange={handlePasswordChange} />
          {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}

          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <Input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handlePasswordChange} />

          <div className="flex items-center">
            <input type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} required className="h-4 w-4" />
            <label className="ml-2 text-sm text-gray-900">
              I agree to the{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>
            </label>
          </div>

          <Button type="submit" className="w-full flex justify-center items-center" disabled={isLoading}>
            {isLoading ? <span className="animate-spin mr-2">🔄</span> : null} {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
