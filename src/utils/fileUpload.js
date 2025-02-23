// src/utils/fileUpload.js

/**
 * Converts a File object to a data URL for API transmission
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Data URL representation of the file
 */
export const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };
  
  /**
   * Validates a file based on size and type
   * @param {File} file - The file to validate
   * @param {object} options - Validation options
   * @param {number} options.maxSizeMB - Maximum file size in MB (default: 10)
   * @param {string[]} options.allowedTypes - Array of allowed MIME types
   * @returns {object} - Validation result with isValid and error properties
   */
  export const validateFile = (file, options = {}) => {
    const { 
      maxSizeMB = 10, 
      allowedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ] 
    } = options;
  
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File is too large. Maximum size is ${maxSizeMB}MB.`
      };
    }
  
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not supported. Allowed types: ${allowedTypes.join(', ')}`
      };
    }
  
    return { isValid: true };
  };
  
  /**
   * Prepares file objects for API submission by adding dataUrl
   * @param {File[]} files - Array of file objects
   * @param {object} options - Validation options to pass to validateFile
   * @returns {Promise<object>} - Object with prepared files and any validation errors
   */
  export const prepareFilesForUpload = async (files, options = {}) => {
    const preparedFiles = [];
    const errors = [];
  
    for (const file of files) {
      // Validate the file
      const validation = validateFile(file, options);
      
      if (!validation.isValid) {
        errors.push({
          name: file.name,
          error: validation.error
        });
        continue;
      }
  
      try {
        // Convert to data URL
        const dataUrl = await fileToDataUrl(file);
        
        // Add to prepared files
        preparedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl
        });
      } catch (error) {
        errors.push({
          name: file.name,
          error: 'Failed to process file'
        });
      }
    }
  
    return {
      preparedFiles,
      errors,
      hasErrors: errors.length > 0,
      allFailed: errors.length === files.length && files.length > 0
    };
  };
  
  /**
   * Uploads files to the application API endpoint
   * @param {string} applicationId - The ID of the application
   * @param {Array} preparedFiles - Array of prepared file objects with dataUrls
   * @returns {Promise<object>} - Upload result with success status and any errors
   */
  export const uploadFilesToApplication = async (applicationId, preparedFiles) => {
    try {
      const response = await fetch('/api/upload/application-cloudinary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          files: preparedFiles
        })
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload files');
      }
  
      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };