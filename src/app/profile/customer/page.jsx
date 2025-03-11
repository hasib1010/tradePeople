"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function CustomerProfilePage() {
    const router = useRouter();
    const { data: session, status, update } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/login?callbackUrl=/profile/customer");
        },
    });

    const [profileImage, setProfileImage] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "customer") {
                router.push(session.user.role === "tradesperson" ? "/profile" : "/dashboard");
                return;
            }

            const fetchProfileData = async () => {
                try {
                    const response = await fetch('/api/profile', {
                        credentials: 'include',
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to load profile data: ${response.status}`);
                    }
                    const data = await response.json();
                    setProfileImage(data.user.profileImage || "/images/default-profile.jpg");
                    setPreviewUrl(data.user.profileImage || "/images/default-profile.jpg");
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchProfileData();
        }
    }, [status, session, router]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Please select a valid image file (JPEG, PNG, JPG, WEBP)');
            return;
        }

        // Create a preview
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        setUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'tradesperson_profiles');

        try {
            if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
                throw new Error('Cloudinary cloud name is not configured');
            }

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
            }

            const data = await response.json();
            setProfileImage(data.secure_url); // Update profileImage with the uploaded URL
        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadError(`Failed to upload image: ${error.message}`);
            setPreviewUrl(profileImage); // Revert to current image on error
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setUpdateSuccess(false);

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileImage }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update profile image: ${errorData.error || response.status}`);
            }

            await update({ ...session, user: { ...session.user, profileImage } });
            setUpdateSuccess(true);
        } catch (error) {
            console.error("Error updating profile image:", error);
            setError(error.message);
        } finally {
            setSubmitting(false);
            if (updateSuccess) setTimeout(() => setUpdateSuccess(false), 3000);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Update Profile Image</h1>
                    <p className="mt-1 text-sm text-gray-500">Change your profile picture</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {uploadError && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                )}

                {updateSuccess && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                        <p className="text-sm text-green-700">Profile image updated successfully!</p>
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                    <div className="flex items-center space-x-6">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden">
                            <Image
                                src={previewUrl || profileImage}
                                alt="Profile"
                                width={96}
                                height={96}
                                className="object-cover"
                            />
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block">
                                <span className="sr-only">Choose profile photo</span>
                                <input
                                    type="file"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    disabled={uploading || submitting}
                                />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, or WEBP up to 5MB</p>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || uploading}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {submitting ? "Saving..." : "Save Image"}
                            </button>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link href="/dashboard" className="text-blue-600 hover:underline">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}