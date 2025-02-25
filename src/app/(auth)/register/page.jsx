"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IoEye, IoEyeOff } from "react-icons/io5";



export default function RegisterPage() {
  const router = useRouter();

  const [isPassShow, setIsPassShow] = useState(false)

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
  const isValidUKPostcode = (postcode) => {
    const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i;
    return ukPostcodeRegex.test(postcode.trim());
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



    const isValidPost = isValidUKPostcode(formData?.location?.postalCode)
    if (!isValidPost) {
      setError("Please provide a valid uk postal code")
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
      <div className="max-w-2xl p-10 mx-auto border shadow-sm">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your customer account
        </h2>
        <div className=" space-y-4 text-center text-sm text-gray-600">
          <p>Or{" "}</p>
          <p>
            <Link href="/register-tradesperson" className="font-medium text-blue-600 px-10 py-3 mt-2">
              register as a tradesperson
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-10 " onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">



            <div className="relative">
              <Input
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={
                  "peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
                }
                placeholder=" "
              />
              <label
                className={`absolute left-3 transition-all text-lg ${formData.firstName
                  ? "-top-2 text-xs  bg-gray-50 px-1"
                  : "top-4 text-gray-500 peer-placeholder-shown:top-[10px] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                  }`}
              >
                First Name
              </label>
            </div>





            <div className="relative">
              <Input
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
                placeholder=" "
              />
              <label
                className={`absolute left-3 transition-all text-lg ${formData.lastName
                  ? "-top-2 text-xs bg-gray-50 px-1"
                  : "top-4 text-gray-500 peer-placeholder-shown:top-[10px] peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                  }`}
              >
                Last Name
              </label>
            </div>

          </div>

          <div className="relative">
            <Input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
              placeholder=" "
            />
            <label
              className={`absolute left-3 transition-all text-lg ${formData.email
                ? "-top-2 text-xs bg-gray-50 px-1"
                : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                }`}
            >
              Email Address
            </label>
          </div>


          <div className="relative">
            <Input
              name="phoneNumber"
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
              placeholder=" "
            />
            <label
              className={`absolute left-3 transition-all text-lg ${formData.phoneNumber
                ? "-top-2 text-xs bg-gray-50 px-1"
                : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                }`}
            >
              Phone Number
            </label>
          </div>


          <div className="relative">
            <Input
              name="location.address"
              type="text"
              required
              value={formData.location.address}
              onChange={handleChange}
              className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
              placeholder=" "
            />
            <label
              className={`absolute left-3 transition-all text-lg ${formData.location.address
                ? "-top-2 text-xs bg-gray-50 px-1"
                : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                }`}
            >
              Address
            </label>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Input
                name="location.city"
                type="text"
                required
                value={formData.location.city}
                onChange={handleChange}
                className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
                placeholder=" "
              />
              <label
                className={`absolute left-3 transition-all text-lg ${formData.location.city
                  ? "-top-2 text-xs bg-gray-50 px-1"
                  : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                  }`}
              >
                City
              </label>
            </div>

            <div className="relative">
              <Input
                name="location.state"
                type="text"
                required
                value={formData.location.state}
                onChange={handleChange}
                className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
                placeholder=" "
              />
              <label
                className={`absolute left-3 transition-all text-lg ${formData.location.state
                  ? "-top-2 text-xs bg-gray-50 px-1"
                  : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                  }`}
              >
                State
              </label>
            </div>
          </div>

          <div className="relative">
            <Input
              name="location.postalCode"
              type="text"
              required
              value={formData.location.postalCode}
              onChange={handleChange}
              className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
              placeholder=" "
            />
            <label
              className={`absolute left-3 transition-all text-lg ${formData.location.postalCode
                ? "-top-2 text-xs bg-gray-50 px-1"
                : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                }`}
            >
              Postal Code [e.g, SW1A 1AA]
            </label>
          </div>


          <div className="relative">
            <Input
              name="password"
              type={isPassShow ? "text" : "password"}
              required
              minLength={8}
              value={formData.password}
              onChange={handlePasswordChange}
              className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
              placeholder=" "
            />
            <label
              className={`absolute left-3 transition-all text-lg ${formData.password
                ? "-top-2 text-xs bg-gray-50 px-1"
                : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                }`}
            >
              Password
            </label>
            <div
              onClick={() => setIsPassShow(!isPassShow)}
              className="absolute cursor-pointer right-4 top-[8px]">
              {
                isPassShow ? <IoEye size={25} /> : <IoEyeOff size={25} />
              }
            </div>
          </div>

          {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}

          <div className="relative">
            <Input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handlePasswordChange}
              className="peer w-full border border-gray-300 focus:border-none bg-white px-3 pt-4 pb-2 text-lg rounded-md focus:outline-none"
              placeholder=" "
            />
            <label
              className={`absolute left-3 transition-all text-lg ${formData.confirmPassword
                ? "-top-2 text-xs bg-gray-50 px-1"
                : "top-4 text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-sm peer-focus:bg-gray-50 peer-focus:px-1"
                }`}
            >
              Confirm Password
            </label>
          </div>


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
