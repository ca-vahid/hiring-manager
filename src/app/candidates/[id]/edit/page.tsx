'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCandidate } from '@/app/lib/candidateUtils';
import { Candidate } from '@/app/lib/types';
import CandidateForm from '@/app/components/CandidateForm';

export default function EditCandidatePage() {
  const params = useParams();
  const candidateId = params.id as string;
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load candidate on mount
  useEffect(() => {
    const loadCandidate = async () => {
      try {
        const data = await getCandidate(candidateId);
        if (data) {
          setCandidate(data);
        } else {
          setError('Candidate not found');
        }
      } catch (err) {
        console.error('Error loading candidate:', err);
        setError('Failed to load candidate data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCandidate();
  }, [candidateId]);
  
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Candidate</h1>
            <Link
              href={`/candidates/${candidateId}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </header>
      
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CandidateForm
          initialData={candidate}
          isEditing={true}
        />
      </div>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Junior IT Hiring Manager - A comprehensive tool for managing the hiring process
          </p>
        </div>
      </footer>
    </main>
  );
} 