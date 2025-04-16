'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { getCandidate, updateCandidate } from '@/app/lib/candidateUtils';
import { Candidate, DocumentInfo, AIAnalysis, CategoryScores } from '@/app/lib/types';
import StarRating from '@/app/components/StarRating';
import DocumentUpload from '@/app/components/DocumentUpload';
import DocumentAnalysis from '@/app/components/DocumentAnalysis';
import { debug } from '@/app/lib/debug';

export default function CandidatePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'coverLetter' | 'notes' | 'transcripts'>('profile');
  
  // Load candidate on mount
  useEffect(() => {
    const loadCandidate = async () => {
      try {
        debug.info(`Loading candidate with ID: ${candidateId}`);
        const data = await getCandidate(candidateId);
        if (data) {
          debug.success(`Successfully loaded candidate: ${data.name}`);
          setCandidate(data);
        } else {
          debug.warning(`Candidate not found: ${candidateId}`);
          setError('Candidate not found');
        }
      } catch (err) {
        console.error('Error loading candidate:', err);
        debug.error(`Error loading candidate: ${candidateId}`, err);
        setError('Failed to load candidate data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCandidate();
  }, [candidateId]);
  
  // Handle star rating change
  const handleRatingChange = async (rating: number) => {
    if (!candidate) return;
    
    try {
      await updateCandidate(candidateId, { starRating: rating });
      setCandidate({ ...candidate, starRating: rating });
    } catch (err) {
      console.error('Error updating rating:', err);
      alert('Failed to update rating');
    }
  };
  
  // Handle status change
  const handleStatusChange = async (status: 'Active' | 'Inactive') => {
    if (!candidate) return;
    
    try {
      await updateCandidate(candidateId, { status });
      setCandidate({ ...candidate, status });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };
  
  // Handle document upload
  const handleDocumentUpload = async (documentType: keyof Candidate['documents'], documentInfo: DocumentInfo) => {
    if (!candidate) return;
    
    try {
      const updatedDocuments = { ...candidate.documents };
      
      if (documentType === 'resume' || documentType === 'coverLetter') {
        // Single document types
        updatedDocuments[documentType] = documentInfo;
      } else {
        // Array document types (notes, transcripts)
        const currentDocuments = updatedDocuments[documentType] || [];
        updatedDocuments[documentType] = [...currentDocuments, documentInfo];
      }
      
      await updateCandidate(candidateId, { documents: updatedDocuments });
      setCandidate({ ...candidate, documents: updatedDocuments });
      
      // Switch to the tab for the uploaded document
      setActiveTab(documentType);
    } catch (err) {
      console.error('Error updating documents:', err);
      alert('Failed to save document');
    }
  };
  
  // Handle AI analysis completion
  const handleAnalysisComplete = async (documentId: string, analysis: AIAnalysis) => {
    if (!candidate) return;
    
    try {
      const updatedDocuments = { ...candidate.documents };
      
      // Find and update the document with analysis
      if (activeTab === 'resume' && updatedDocuments.resume?.id === documentId) {
        updatedDocuments.resume = {
          ...updatedDocuments.resume,
          aiAnalysis: analysis,
        };
      } else if (activeTab === 'coverLetter' && updatedDocuments.coverLetter?.id === documentId) {
        updatedDocuments.coverLetter = {
          ...updatedDocuments.coverLetter,
          aiAnalysis: analysis,
        };
      } else if (activeTab === 'notes' && updatedDocuments.notes) {
        const noteIndex = updatedDocuments.notes.findIndex(note => note.id === documentId);
        if (noteIndex >= 0) {
          updatedDocuments.notes[noteIndex] = {
            ...updatedDocuments.notes[noteIndex],
            aiAnalysis: analysis,
          };
        }
      } else if (activeTab === 'transcripts' && updatedDocuments.transcripts) {
        const transcriptIndex = updatedDocuments.transcripts.findIndex(transcript => transcript.id === documentId);
        if (transcriptIndex >= 0) {
          updatedDocuments.transcripts[transcriptIndex] = {
            ...updatedDocuments.transcripts[transcriptIndex],
            aiAnalysis: analysis,
          };
        }
      }
      
      await updateCandidate(candidateId, { documents: updatedDocuments });
      setCandidate({ ...candidate, documents: updatedDocuments });
    } catch (err) {
      console.error('Error updating document analysis:', err);
      alert('Failed to save analysis results');
    }
  };
  
  // Handle updating candidate scores based on AI analysis
  const handleUpdateScores = async (scores: CategoryScores) => {
    if (!candidate) return;
    
    try {
      await updateCandidate(candidateId, { scores });
      setCandidate({ ...candidate, scores });
    } catch (err) {
      console.error('Error updating scores:', err);
      alert('Failed to update scores');
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-xl font-medium mb-2">{error || 'Candidate not found'}</h2>
          <p className="mb-4">The candidate you're looking for doesn't exist or couldn't be loaded.</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Candidate Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="md:mr-6 mb-4 md:mb-0">
              {candidate.pictureUrl ? (
                <Image
                  src={candidate.pictureUrl}
                  alt={candidate.name}
                  width={100}
                  height={100}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl">
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div>
                  <h2 className="text-2xl font-bold">{candidate.name}</h2>
                  <p className="text-gray-600">{candidate.email}</p>
                  {candidate.phone && <p className="text-gray-600">{candidate.phone}</p>}
                </div>
                
                <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 mr-2">First Impression:</span>
                    <StarRating value={candidate.starRating} onChange={handleRatingChange} size="md" />
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
                    <select
                      value={candidate.status}
                      onChange={(e) => handleStatusChange(e.target.value as 'Active' | 'Inactive')}
                      className="border border-gray-300 rounded-md text-sm p-1"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-3">
                {candidate.linkedin && (
                  <a 
                    href={candidate.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                
                {candidate.github && (
                  <a 
                    href={candidate.github}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-700 hover:text-gray-900"
                  >
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
                
                <div className="flex items-center bg-gray-100 px-3 py-1 rounded-md text-gray-700">
                  <span className="text-sm mr-1">Score:</span>
                  <span className={`font-semibold ${
                    candidate.overallScore >= 80 ? 'text-green-600' :
                    candidate.overallScore >= 60 ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {candidate.overallScore}/100
                  </span>
                </div>
                
                <div className="text-sm text-gray-500">
                  Last updated: {formatDate(candidate.updatedAt)}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(candidate.scores).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="text-xs text-gray-600">
                      {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-lg font-medium">{score}/10</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Document Tabs & Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'resume'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'coverLetter'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Cover Letter
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'notes'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('transcripts')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'transcripts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Transcripts
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                <p className="text-gray-600 mb-4">
                  This section shows a summary of the candidate's profile and documents.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium mb-2">Candidate Documents</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 
                          ${candidate.documents.resume ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {candidate.documents.resume ? '✓' : '✗'}
                        </span>
                        <span>Resume</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 
                          ${candidate.documents.coverLetter ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {candidate.documents.coverLetter ? '✓' : '✗'}
                        </span>
                        <span>Cover Letter</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 
                          ${candidate.documents.notes && candidate.documents.notes.length > 0 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'}`}
                        >
                          {candidate.documents.notes && candidate.documents.notes.length > 0 ? '✓' : '✗'}
                        </span>
                        <span>Notes ({candidate.documents.notes?.length || 0})</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 
                          ${candidate.documents.transcripts && candidate.documents.transcripts.length > 0 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'}`}
                        >
                          {candidate.documents.transcripts && candidate.documents.transcripts.length > 0 ? '✓' : '✗'}
                        </span>
                        <span>Transcripts ({candidate.documents.transcripts?.length || 0})</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium mb-2">Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/candidates/${candidateId}/edit`)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('resume')}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Manage Documents
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Resume</h3>
                
                {candidate.documents.resume ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-medium">{candidate.documents.resume.name}</h4>
                        <p className="text-sm text-gray-600">
                          Uploaded {formatDate(candidate.documents.resume.uploadedAt)}
                        </p>
                      </div>
                      
                      <div>
                        <a
                          href={candidate.documents.resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                    
                    <DocumentAnalysis
                      document={candidate.documents.resume}
                      onAnalysisComplete={handleAnalysisComplete}
                      onUpdateScores={handleUpdateScores}
                    />
                  </div>
                ) : (
                  <DocumentUpload
                    candidateId={candidateId}
                    documentType="resume"
                    onUploadComplete={(documentInfo) => handleDocumentUpload('resume', documentInfo)}
                    acceptedFileTypes=".pdf,.doc,.docx,.txt"
                  />
                )}
              </div>
            )}
            
            {/* Cover Letter Tab */}
            {activeTab === 'coverLetter' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Cover Letter</h3>
                
                {candidate.documents.coverLetter ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-medium">{candidate.documents.coverLetter.name}</h4>
                        <p className="text-sm text-gray-600">
                          Uploaded {formatDate(candidate.documents.coverLetter.uploadedAt)}
                        </p>
                      </div>
                      
                      <div>
                        <a
                          href={candidate.documents.coverLetter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                    
                    <DocumentAnalysis
                      document={candidate.documents.coverLetter}
                      onAnalysisComplete={handleAnalysisComplete}
                      onUpdateScores={handleUpdateScores}
                    />
                  </div>
                ) : (
                  <DocumentUpload
                    candidateId={candidateId}
                    documentType="coverLetter"
                    onUploadComplete={(documentInfo) => handleDocumentUpload('coverLetter', documentInfo)}
                    acceptedFileTypes=".pdf,.doc,.docx,.txt"
                  />
                )}
              </div>
            )}
            
            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Notes</h3>
                </div>
                
                <DocumentUpload
                  candidateId={candidateId}
                  documentType="notes"
                  onUploadComplete={(documentInfo) => handleDocumentUpload('notes', documentInfo)}
                  acceptedFileTypes=".pdf,.doc,.docx,.txt"
                />
                
                {candidate.documents.notes && candidate.documents.notes.length > 0 ? (
                  <div className="space-y-6 mt-6">
                    {candidate.documents.notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="font-medium">{note.name}</h4>
                            <p className="text-sm text-gray-600">
                              Uploaded {formatDate(note.uploadedAt)}
                            </p>
                          </div>
                          
                          <div>
                            <a
                              href={note.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                            >
                              View Document
                            </a>
                          </div>
                        </div>
                        
                        <DocumentAnalysis
                          document={note}
                          onAnalysisComplete={handleAnalysisComplete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No notes have been uploaded yet.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Transcripts Tab */}
            {activeTab === 'transcripts' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Interview Transcripts</h3>
                </div>
                
                <DocumentUpload
                  candidateId={candidateId}
                  documentType="transcripts"
                  onUploadComplete={(documentInfo) => handleDocumentUpload('transcripts', documentInfo)}
                  acceptedFileTypes=".pdf,.doc,.docx,.txt"
                />
                
                {candidate.documents.transcripts && candidate.documents.transcripts.length > 0 ? (
                  <div className="space-y-6 mt-6">
                    {candidate.documents.transcripts.map((transcript) => (
                      <div key={transcript.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="font-medium">{transcript.name}</h4>
                            <p className="text-sm text-gray-600">
                              Uploaded {formatDate(transcript.uploadedAt)}
                            </p>
                          </div>
                          
                          <div>
                            <a
                              href={transcript.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                            >
                              View Document
                            </a>
                          </div>
                        </div>
                        
                        <DocumentAnalysis
                          document={transcript}
                          onAnalysisComplete={handleAnalysisComplete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No interview transcripts have been uploaded yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Junior IT Hiring Manager - A comprehensive tool for managing the hiring process
          </p>
        </div>
      </footer>
    </main>
  );
} 