// src/app/(auth)/register-tradesperson/page.jsx
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function RegisterTradespersonPageContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    businessName: "",
    skills: [],
    yearsOfExperience: "",
    hourlyRate: "",
    description: "",
    profileImage: null,
    location: {
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States"
    },
    certifications: [{
      name: "",
      issuingOrganization: "",
      dateIssued: "",
      expirationDate: "",
      licenseDocument: null
    }],
    insurance: {
      hasInsurance: false,
      insuranceProvider: "",
      policyNumber: "",
      coverageAmount: "",
      expirationDate: "",
      insuranceDocument: null
    },
    serviceArea: {
      radius: 25,
      cities: []
    }
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);
  const [insurancePreview, setInsurancePreview] = useState(null);

  const skillOptions = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting',
    'Roofing', 'HVAC', 'Landscaping', 'Masonry',
    'Flooring', 'Tiling', 'General Contracting', 'Drywall',
    'Cabinetry', 'Fencing', 'Decking', 'Concrete',
    'Window Installation', 'Door Installation', 'Appliance Repair',
    'Handyman Services', 'Cleaning Services', 'Moving Services',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (!file) return;

      // Handle different file inputs
      if (name === 'profileImage') {
        setFormData({ ...formData, profileImage: file });
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      }
      else if (name === 'certifications[0].licenseDocument') {
        const updatedCertifications = [...formData.certifications];
        updatedCertifications[0].licenseDocument = file;
        setFormData({ ...formData, certifications: updatedCertifications });

        const reader = new FileReader();
        reader.onloadend = () => setLicensePreview(reader.result);
        reader.readAsDataURL(file);
      }
      else if (name === 'insurance.insuranceDocument') {
        setFormData({
          ...formData,
          insurance: {
            ...formData.insurance,
            insuranceDocument: file
          }
        });

        const reader = new FileReader();
        reader.onloadend = () => setInsurancePreview(reader.result);
        reader.readAsDataURL(file);
      }
      return;
    }

    if (type === 'checkbox' && name === 'insurance.hasInsurance') {
      setFormData({
        ...formData,
        insurance: {
          ...formData.insurance,
          hasInsurance: checked
        }
      });
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    }
    else if (name.includes("[")) {
      // Handle array fields like certifications[0].name
      const matches = name.match(/([a-zA-Z]+)\[(\d+)\]\.([a-zA-Z]+)/);
      if (matches && matches.length === 4) {
        const [_, arrayName, index, property] = matches;
        const updatedArray = [...formData[arrayName]];
        updatedArray[index] = {
          ...updatedArray[index],
          [property]: value
        };
        setFormData({
          ...formData,
          [arrayName]: updatedArray
        });
      }
    }
    else if (name === "skills") {
      // Handle multi-select for skills
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData({
        ...formData,
        skills: selectedOptions
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const isValidUKPostcode = (postcode) => {
    const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i;
    return ukPostcodeRegex.test(postcode.trim());
  };

  const nextStep = () => {
    // Validation for each step
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword ||
        !formData.firstName || !formData.lastName || !formData.phoneNumber) {
        setError("Please fill all required fields");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
    }

    if (step === 2) {
      if (formData.skills.length === 0) {
        setError("Please select at least one skill");
        return;
      }
    }

    if (step === 3) {




      if (!formData.location.address || !formData.location.city ||
        !formData.location.state || !formData.location.postalCode) {
        setError("Please fill all location fields");
        return;
      }

      const isValidPost = isValidUKPostcode(formData?.location?.postalCode)
      
      if (!isValidPost) {
        setError("Please provide a valid uk postal code")

        return;
      }
    }

    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();

      // Append basic fields
      Object.keys(formData).forEach(key => {
        if (key === "profileImage") {
          if (formData[key]) {
            formDataToSend.append(key, formData[key]);
          }
        }
        else if (key === "skills" || key === "location" || key === "serviceArea") {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        }
        else if (key === "certifications") {
          // Handle certifications array
          const certData = formData.certifications.map(cert => {
            const { licenseDocument, ...certDetails } = cert;
            return certDetails;
          });
          formDataToSend.append('certifications', JSON.stringify(certData));

          // Append license document separately
          if (formData.certifications[0].licenseDocument) {
            formDataToSend.append(
              'licenseDocument',
              formData.certifications[0].licenseDocument
            );
          }
        }
        else if (key === "insurance") {
          // Handle insurance object
          const { insuranceDocument, ...insuranceDetails } = formData.insurance;
          formDataToSend.append('insurance', JSON.stringify(insuranceDetails));

          // Append insurance document separately
          if (formData.insurance.insuranceDocument) {
            formDataToSend.append(
              'insuranceDocument',
              formData.insurance.insuranceDocument
            );
          }
        }
        else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch("/api/auth/register-tradesperson", {
        method: "POST",
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password
      });

      if (loginResult.error) {
        router.push("/login?message=Registration successful. Please login.");
      } else {
        router.push("/dashboard/tradesperson");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render different steps of the form
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name*
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  placeholder="First Name"
                  onChange={handleChange}
                  className="mt-1 py-3 border pl-4 border-gray-300 py-3 pl-4 border block w-full rounded-md  shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name*
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number*
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., +44 7911 123456"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password*
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password*
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                <input
                  id="profileImage"
                  name="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <div className="h-24 w-24 overflow-hidden rounded-full">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business / Owner Name
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g., Tech Innovators Ltd."
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Skills & Expertise*
                </label>
                <select
                  id="skills"
                  name="skills"
                  multiple
                  required
                  value={formData.skills}
                  onChange={handleChange}
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-40"
                >
                  {skillOptions.map(skill => (
                    <option className="py-2" key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple skills
                </p>
              </div>
              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                  Hourly Rate (USD)
                </label>
                <input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="e.g 20"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Professional Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Describe your services, experience, and expertise..."
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
                  Street Address*
                </label>
                <input
                  id="location.address"
                  name="location.address"
                  type="text"
                  required
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="e.g., 221B Baker Street"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                  City*
                </label>
                <input
                  id="location.city"
                  name="location.city"
                  type="text"
                  required
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="e.g., London"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                  State*
                </label>
                <input
                  id="location.state"
                  name="location.state"
                  type="text"
                  required
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="e.g., Greater London"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="location.postalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code*
                </label>
                <input
                  id="location.postalCode"
                  name="location.postalCode"
                  type="text"
                  required
                  value={formData.location.postalCode}
                  onChange={handleChange}
                  placeholder="e.g., NW1 6XE"
                  className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="serviceArea.radius" className="block text-sm font-medium text-gray-700">
                  Service Radius (miles)
                </label>
                <input
                  id="serviceArea.radius"
                  name="serviceArea.radius"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.serviceArea.radius}
                  onChange={handleChange}
                  className="mt-1 block w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 miles</span>
                  <span>{formData.serviceArea.radius} miles</span>
                  <span>100 miles</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">License & Certifications</h3>
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Your license information is required for verification purposes. You won't be able to apply for jobs until your license has been verified by our team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="certifications[0].name" className="block text-sm font-medium text-gray-700">
                    License/Certification Name*
                  </label>
                  <input
                    id="certifications[0].name"
                    name="certifications[0].name"
                    type="text"
                    required
                    defaultValue={formData.certifications?.[0]?.name || ""}  // Ensure it's always a string
                    onChange={handleChange}
                    placeholder="e.g., Master Plumber License"
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />

                </div>
                <div>
                  <label htmlFor="certifications[0].issuingOrganization" className="block text-sm font-medium text-gray-700">
                    Issuing Organization*
                  </label>
                  <input
                    id="certifications[0].issuingOrganization"
                    name="certifications[0].issuingOrganization"
                    type="text"
                    required
                    defaultValue={formData.certifications[0].issuingOrganization}
                    onChange={handleChange}
                    placeholder="e.g., State Board of Contractors"
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="certifications[0].dateIssued" className="block text-sm font-medium text-gray-700">
                    Date Issued
                  </label>
                  <input
                    id="certifications[0].dateIssued"
                    name="certifications[0].dateIssued"
                    type="date"
                    defaultValue={formData.certifications[0].dateIssued}
                    onChange={handleChange}
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="certifications[0].expirationDate" className="block text-sm font-medium text-gray-700">
                    Expiration Date
                  </label>
                  <input
                    id="certifications[0].expirationDate"
                    name="certifications[0].expirationDate"
                    type="date"
                    defaultValue={formData.certifications[0].expirationDate}
                    onChange={handleChange}
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="certifications[0].licenseDocument" className="block text-sm font-medium text-gray-700">
                    Upload License Document* (PDF or Image)
                  </label>
                  <input
                    id="certifications[0].licenseDocument"
                    name="certifications[0].licenseDocument"
                    type="file"
                    required
                    accept=".pdf,image/*"
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {licensePreview && (
                    <div className="mt-2">
                      <div className="h-24 border border-gray-300 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {licensePreview.startsWith('data:image') ? (
                          <img
                            src={licensePreview}
                            alt="License preview"
                            className="max-h-full"
                          />
                        ) : (
                          <div className="text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>PDF Document</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="insurance.hasInsurance"
                  name="insurance.hasInsurance"
                  type="checkbox"
                  checked={formData.insurance.hasInsurance}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="insurance.hasInsurance" className="ml-2 block text-sm text-gray-900">
                  I have liability insurance for my business
                </label>
              </div>
            </div>

            {formData.insurance.hasInsurance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="insurance.insuranceProvider" className="block text-sm font-medium text-gray-700">
                    Insurance Provider
                  </label>
                  <input
                    id="insurance.insuranceProvider"
                    name="insurance.insuranceProvider"
                    type="text"
                    value={formData.insurance.insuranceProvider}
                    onChange={handleChange}
                    placeholder="e.g., Aviva Insurance"
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="insurance.policyNumber" className="block text-sm font-medium text-gray-700">
                    Policy Number
                  </label>
                  <input
                    id="insurance.policyNumber"
                    name="insurance.policyNumber"
                    type="text"
                    value={formData.insurance.policyNumber}
                    onChange={handleChange}
                    placeholder="e.g., UK-AV1234567"
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="insurance.coverageAmount" className="block text-sm font-medium text-gray-700">
                    Coverage Amount (USD)
                  </label>
                  <input
                    id="insurance.coverageAmount"
                    name="insurance.coverageAmount"
                    type="number"
                    min="0"
                    value={formData.insurance.coverageAmount}
                    onChange={handleChange}
                    placeholder="e.g., 250,000"
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="insurance.expirationDate" className="block text-sm font-medium text-gray-700">
                    Expiration Date
                  </label>
                  <input
                    id="insurance.expirationDate"
                    name="insurance.expirationDate"
                    type="date"
                    value={formData.insurance.expirationDate}
                    onChange={handleChange}
                    className="mt-1 py-3 pl-4 border block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="insurance.insuranceDocument" className="block text-sm font-medium text-gray-700">
                    Insurance Document (PDF or Image)
                  </label>
                  <input
                    id="insurance.insuranceDocument"
                    name="insurance.insuranceDocument"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                  />
                  {insurancePreview && (
                    <div className="mt-2">
                      <div className="h-24 border border-gray-300 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {insurancePreview.startsWith('data:image') ? (
                          <img
                            src={insurancePreview}
                            alt="Insurance document preview"
                            className="max-h-full"
                          />
                        ) : (
                          <div className="text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>PDF Document</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Submit</h3>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Please review your information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Please verify all the information you've entered is correct before submitting. You can go back to previous steps to make changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900">Personal Information</h4>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{formData.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Business:</span>
                    <span className="font-medium">{formData.businessName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Skills & Experience</h4>
                <div className="mt-2 text-sm">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.skills.map(skill => (
                      <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Years of Experience:</span>
                      <span className="font-medium">{formData.yearsOfExperience || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hourly Rate:</span>
                      <span className="font-medium">{formData.hourlyRate ? `$${formData.hourlyRate}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <div className="mt-2 text-sm">
                  <p className="mb-1">{formData.location.address}</p>
                  <p>{formData.location.city}, {formData.location.state} {formData.location.postalCode}</p>
                  <p className="mt-1 text-gray-500">Service radius: {formData.serviceArea.radius} miles</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">License & Certification</h4>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">License:</span>
                    <span className="font-medium">{formData.certifications[0].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issued By:</span>
                    <span className="font-medium">{formData.certifications[0].issuingOrganization}</span>
                  </div>
                  {formData.certifications[0].dateIssued && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issued Date:</span>
                      <span className="font-medium">{new Date(formData.certifications[0].dateIssued).toLocaleDateString()}</span>
                    </div>
                  )}
                  {formData.certifications[0].expirationDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expiration Date:</span>
                      <span className="font-medium">{new Date(formData.certifications[0].expirationDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {formData.insurance.hasInsurance && (
                <div>
                  <h4 className="font-medium text-gray-900">Insurance Information</h4>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Provider:</span>
                      <span className="font-medium">{formData.insurance.insuranceProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Policy Number:</span>
                      <span className="font-medium">{formData.insurance.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coverage Amount:</span>
                      <span className="font-medium">${formData.insurance.coverageAmount}</span>
                    </div>
                    {formData.insurance.expirationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Expiration Date:</span>
                        <span className="font-medium">{new Date(formData.insurance.expirationDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-900">
                  I confirm that all information provided is accurate and I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Register as a tradesperson
          </h2>
          <div className=" space-y-2 mt-4 text-center text-sm text-gray-600">
            <p>Or{" "}</p>
            <p>
              <Link href="/register" className="font-medium inline-block text-blue-600 px-10 p-3">
                Register as a customer
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="overflow-hidden">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                {[
                  "Personal Info",
                  "Professional Info",
                  "Location",
                  "License & Certifications",
                  "Insurance",
                  "Review"
                ].map((label, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step > index
                        ? "border-blue-600 bg-blue-600 text-white"
                        : step === index + 1
                          ? "border-blue-600 text-blue-600"
                          : "border-gray-300 text-gray-400"
                        }`}
                    >
                      {step > index ? (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${step >= index + 1 ? "text-blue-600" : "text-gray-500"
                      }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {renderStep()}

              <div className="mt-6 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Previous
                  </button>
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                    <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-auto inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>





          </div>
        </div>
      </div>
    </div>
  );
}