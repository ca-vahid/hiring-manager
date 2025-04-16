'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadCandidateDocument } from '../lib/candidateUtils';
import { DocumentInfo } from '../lib/types';

interface DocumentUploadProps {
  candidateId: string;
  documentType: 'resume' | 'coverLetter' | 'notes' | 'transcripts';
  onUploadComplete: (documentInfo: DocumentInfo) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string;
}

const DocumentUpload = ({
  candidateId,
  documentType,
  onUploadComplete,
  maxSizeMB = 10,
  acceptedFileTypes = '.pdf,.doc,.docx,.txt',
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      // Validate file size
      if (file.size > maxSizeBytes) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }
      
      // Validate file type from the actual file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = acceptedFileTypes.split(',').map(type => 
        type.trim().toLowerCase().replace('.', '')
      );
      
      if (fileExtension && !acceptedExtensions.includes(fileExtension)) {
        setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
        return;
      }
      
      setError(null);
      setIsUploading(true);
      setProgress(10);
      
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + Math.floor(Math.random() * 10);
            return newProgress >= 90 ? 90 : newProgress;
          });
        }, 200);
        
        // Upload file to Firebase Storage
        const documentInfo = await uploadCandidateDocument(candidateId, file, documentType);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Notify parent component of successful upload
        onUploadComplete(documentInfo);
        
        // Reset state after a short delay
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
        }, 500);
        
      } catch (error) {
        console.error('Error uploading document:', error);
        setError('Failed to upload document. Please try again.');
        setIsUploading(false);
        setProgress(0);
      }
    },
    [candidateId, documentType, maxSizeBytes, maxSizeMB, acceptedFileTypes, onUploadComplete]
  );
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange]
  );
  
  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Get document type display name
  const getDocumentTypeDisplay = () => {
    switch (documentType) {
      case 'resume':
        return 'Resume';
      case 'coverLetter':
        return 'Cover Letter';
      case 'notes':
        return 'Notes';
      case 'transcripts':
        return 'Interview Transcript';
      default:
        return 'Document';
    }
  };
  
  return (
    <div className="mb-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragging ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}
          ${isUploading ? 'pointer-events-none opacity-70' : 'hover:border-blue-300'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileChange(e.target.files)}
          accept={acceptedFileTypes}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="py-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Uploading... {progress}%</p>
          </div>
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              className="mx-auto h-12 w-12 text-gray-400"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Upload {getDocumentTypeDisplay()}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {`Max size: ${maxSizeMB}MB • Formats: ${acceptedFileTypes.replace(/\./g, '')}`}
            </p>
          </>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default DocumentUpload; 