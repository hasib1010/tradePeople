// src/components/FileUploadSection.jsx
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { prepareFilesForUpload } from '@/utils/fileUpload';
import { XCircle } from 'lucide-react';

const FileUploadSection = ({ files, onChange, error }) => {
  const [uploadProgress, setUploadProgress] = useState(null);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFileChange = async (e) => {
    const fileList = Array.from(e.target.files);
    if (fileList.length === 0) return;

    setProcessingFiles(true);
    setValidationErrors([]);

    try {
      // Validate and prepare files
      const result = await prepareFilesForUpload(fileList, {
        maxSizeMB: 10,
        allowedTypes: [
          'application/pdf', 
          'image/jpeg', 
          'image/png', 
          'image/gif', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });

      // Handle validation errors
      if (result.hasErrors) {
        setValidationErrors(result.errors);
        
        // If all files failed validation, stop here
        if (result.allFailed) {
          setProcessingFiles(false);
          return;
        }
      }

      // Pass the prepared files to parent component
      // We don't actually upload here - that happens after form submission
      onChange(e, result.preparedFiles);
    } catch (err) {
      console.error('Error processing files:', err);
      setValidationErrors([{ name: 'Error', error: 'Failed to process files' }]);
    } finally {
      setProcessingFiles(false);
    }
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    onChange({ target: { name: 'attachments', value: updatedFiles } });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="col-span-1">
      <label className="block text-sm font-medium text-gray-700">
        Attachments (Optional)
      </label>
      <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <span>{processingFiles ? 'Processing...' : 'Upload files'}</span>
              <Input
                id="file-upload"
                name="attachments"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
                disabled={processingFiles}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">
            Portfolio examples, certificates, or other relevant documents
          </p>
          <p className="text-xs text-gray-500">
            Max 10MB per file. PDF, Word, and common image formats accepted.
          </p>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-red-600">The following files could not be uploaded:</p>
          <ul className="mt-1 text-sm text-red-500 list-disc list-inside">
            {validationErrors.map((err, index) => (
              <li key={index}>{err.name}: {err.error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* General error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
          <ul className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-md">
            {files.map((file, index) => (
              <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="w-0 flex-1 flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2 flex-1 w-0 truncate">
                    {file.name}
                  </span>
                </div>
                <div className="ml-4 flex-shrink-0 flex items-center">
                  <span className="mr-2 text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500 text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;