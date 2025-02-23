// src\lib\cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
export const uploadImage = async (file, folder = 'tradePeople') => {
    try {
      // If file is a base64 encoded image
      if (typeof file === 'string' && file.includes('base64')) {
        const result = await cloudinary.uploader.upload(file, {
          folder,
          resource_type: 'auto',
        });
        return result.secure_url;
      }
      
      // Check if file is a File/Blob object with path property (browser File object won't have this)
      if (file && file.path) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: 'auto',
        });
        return result.secure_url;
      }
      
      // For browser File objects or other cases, throw an error
      throw new Error('Invalid file format for upload');
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  };

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
};

export default cloudinary;