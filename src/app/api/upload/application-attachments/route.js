// src/app/api/upload/application-attachments/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDb from '@/lib/db';
import Application from '@/models/Application';
import cloudinary from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to upload files' },
        { status: 401 }
      );
    }

    // Handle multipart form data
    const formData = await request.formData();
    const applicationId = formData.get('applicationId');
    const files = formData.getAll('files');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDb();

    // Find the application
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify the application belongs to the current user
    if (application.tradesperson.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to upload files to this application' },
        { status: 403 }
      );
    }

    // Upload each file and track attachments
    const attachments = [];
    for (const file of files) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB.` },
          { status: 400 }
        );
      }

      // Check file type (optional - you can add file type validation here)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has an unsupported format.` },
          { status: 400 }
        );
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `applications/${applicationId}/${timestamp}-${file.name.replace(/\s+/g, '-')}`;

      // Convert file to buffer or data URL for Cloudinary upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      
      // Upload file to Cloudinary
      const url = await cloudinary.uploader.upload(dataUrl, {
        folder: `applications/${applicationId}`,
        public_id: timestamp + '-' + file.name.replace(/\s+/g, '-'),
        resource_type: 'auto'
      }).then(result => result.secure_url);

      // Add to attachments array
      attachments.push({
        name: file.name,
        url: url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      });
    }

    // Update application with attachment information
    await Application.findByIdAndUpdate(
      applicationId,
      { 
        $push: { attachments: { $each: attachments } },
        $set: { lastUpdated: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      attachments: attachments
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while uploading files' },
      { status: 500 }
    );
  }
}