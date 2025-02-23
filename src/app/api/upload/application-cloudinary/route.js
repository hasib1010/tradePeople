// src/app/api/upload/application-cloudinary/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth'; // Fixed import
import { connectToDatabase } from '@/lib/db';
import Application from '@/models/Application';
import cloudinary from '@/lib/cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Increase limit for file uploads
    },
  },
  // Increase the request timeout for file uploads
  maxDuration: 60, // 60 seconds
};

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

    // Parse the request body
    const data = await request.json();
    const { applicationId, files } = data;

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
    await connectToDatabase();

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

    // Upload each file to Cloudinary and track attachments
    const attachments = [];
    const uploadPromises = files.map(async (file) => {
      try {
        // Generate a unique identifier
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
        
        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(file.dataUrl, {
          folder: `applications/${applicationId}`,
          public_id: uniqueFilename,
          resource_type: 'auto'
        });

        // Add to attachments array with Cloudinary metadata
        return {
          name: file.name,
          url: result.secure_url,
          publicId: result.public_id,
          type: file.type,
          size: file.size,
          uploadedAt: new Date()
        };
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Return error information for this file but continue with others
        return {
          name: file.name,
          error: error.message || 'Upload failed',
          failed: true
        };
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    
    // Separate successful uploads and failures
    const successfulUploads = uploadResults.filter(result => !result.failed);
    const failedUploads = uploadResults.filter(result => result.failed);

    // Only update database if there are successful uploads
    if (successfulUploads.length > 0) {
      // Update application with attachment information
      await Application.findByIdAndUpdate(
        applicationId,
        { 
          $push: { attachments: { $each: successfulUploads } },
          $set: { lastUpdated: new Date() }
        }
      );
    }

    // Return appropriate response
    if (failedUploads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All files uploaded successfully',
        attachments: successfulUploads
      });
    } else if (successfulUploads.length === 0) {
      return NextResponse.json(
        { 
          error: 'All file uploads failed', 
          failedUploads 
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json({
        partialSuccess: true,
        message: 'Some files were uploaded successfully',
        attachments: successfulUploads,
        failedUploads: failedUploads
      });
    }
  } catch (error) {
    console.error('Error in file upload process:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your upload' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing an attachment
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to delete files' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const attachmentId = searchParams.get('attachmentId');
    const publicId = searchParams.get('publicId');

    if (!applicationId || !attachmentId) {
      return NextResponse.json(
        { error: 'Application ID and attachment ID are required' },
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
        { error: 'You do not have permission to delete files from this application' },
        { status: 403 }
      );
    }

    // Find the attachment
    const attachment = application.attachments.id(attachmentId);
    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary if publicId is provided
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Remove the attachment from the application
    await Application.findByIdAndUpdate(
      applicationId,
      {
        $pull: { attachments: { _id: attachmentId } },
        $set: { lastUpdated: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting the attachment' },
      { status: 500 }
    );
  }
}