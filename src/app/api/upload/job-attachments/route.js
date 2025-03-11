import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Job from "@/models/Job";
import { v2 as cloudinary } from "cloudinary";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Explicitly set the API configuration for Next.js
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};

// Helper function to save file to disk temporarily
async function saveFileToDisk(file) {
  try {
    // Create a unique filename to avoid collisions
    const filename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(tmpdir(), filename);
    
    // Convert file to arrayBuffer and then to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write the buffer to a file
    await writeFile(filepath, buffer);
    
    return {
      filepath,
      filename: file.name,
      contentType: file.type,
      size: file.size
    };
  } catch (error) {
    console.error("Error saving file to disk:", error);
    throw error;
  }
}

// Helper function to upload a file to Cloudinary
async function uploadToCloudinary(filePath, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
}

export async function POST(request) {
  try {
    console.log("Job attachment upload started");
    
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Parse form data
    const formData = await request.formData();
    const jobId = formData.get("jobId");
    const files = formData.getAll("files");
    
    console.log(`Received upload request for job ${jobId} with ${files.length} files`);
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    
    // 3. Connect to database and verify job
    await connectToDatabase();
    
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    if (job.customer.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "You don't have permission to upload files to this job" }, { status: 403 });
    }
    
    // 4. Process each file
    const uploadResults = [];
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
        
        // Save file to disk temporarily
        const tempFile = await saveFileToDisk(file);
        console.log(`Saved file temporarily to ${tempFile.filepath}`);
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(
          tempFile.filepath, 
          `job-attachments/${jobId}`
        );
        
        console.log(`Uploaded to Cloudinary. URL: ${uploadResult.secure_url}`);
        
        // Add file info to results
        const fileInfo = {
          name: file.name,
          url: uploadResult.secure_url,
          type: file.type,
          size: file.size,
          uploadedAt: new Date()
        };
        
        uploadResults.push(uploadResult);
        uploadedFiles.push(fileInfo);
        
        // Cleanup temporary file (can do this asynchronously)
        try {
          const fs = require('fs');
          fs.unlinkSync(tempFile.filepath);
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
          // Non-fatal error, continue with the process
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    // 5. Update job with attachment info
    if (uploadedFiles.length > 0) {
      job.attachments = [...(job.attachments || []), ...uploadedFiles];
      await job.save();
      console.log(`Updated job ${jobId} with ${uploadedFiles.length} new attachments`);
    } else {
      console.log("No files were successfully uploaded");
      return NextResponse.json({
        error: "Failed to upload attachments",
        message: "No files were successfully uploaded"
      }, { status: 500 });
    }
    
    // 6. Return success response
    return NextResponse.json({
      success: true,
      attachments: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} files`
    });
  } catch (error) {
    console.error("Error uploading attachments:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload attachments",
        message: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
}