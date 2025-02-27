// components/ImageUpload.jsx
"use client"
import { useState } from 'react';
import Image from 'next/image';

export default function ImageUpload({ onImageUpload, currentImage }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG)');
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'tradesperson_profiles'); // Create this in Cloudinary

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onImageUpload(data.secure_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center">
        <div className="relative h-24 w-24 rounded-full overflow-hidden">
          <img
            src={previewUrl || currentImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>
        <div className="ml-5">
          <label className="block">
            <span className="sr-only">Choose profile photo</span>
            <input 
              type="file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
              accept="image/*"
              disabled={uploading}
            />
          </label>
          <p className="mt-1 text-xs text-gray-500">PNG, JPG, or WEBP up to 5MB</p>
          {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}