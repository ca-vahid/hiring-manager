'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CandidateList from './components/CandidateList';
import CandidateComparison from './components/CandidateComparison';
import { getCandidates } from './lib/candidateUtils';
import { Candidate } from './lib/types';
import { debug } from './lib/debug';
import AuthStatus from './components/AuthStatus';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const { user, loading: authLoading } = useAuth();
  
  // Function to load candidates
  const loadCandidates = async () => {
    // Skip loading if not authenticated
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }
    
    try {
      debug.info("Loading initial candidates from Firestore");
      setLoading(true);
      
      // Use a simple query that won't require a composite index
      // We'll first try with no filters and no sort options to get ANY candidates
      // If that fails, we have a more serious connection issue
      let data: Candidate[] = [];
      
      try {
        // Simple query - just get all candidates with default sorting by updatedAt
        // This query doesn't require any composite indexes
        data = await getCandidates();
        debug.success(`Successfully loaded ${data.length} candidates with default query`);
      } catch (firstError) {
        debug.warning("Initial query failed, trying without sorting", firstError);
        
        // If that fails, try an even simpler query with no sorting at all
        try {
          data = await getCandidates({ status: 'Active' }, undefined);
          debug.success(`Successfully loaded ${data.length} active candidates without sorting`);
        } catch (secondError) {
          debug.error("Even simplified query failed", secondError);
          throw secondError; // Re-throw to be caught by outer catch
        }
      }
      
      // Filter to active candidates on the client-side if needed
      if (data.length > 0 && data.some(c => c.status !== 'Active')) {
        debug.info("Filtering to active candidates on client-side");
        data = data.filter(c => c.status === 'Active');
      }
      
      setCandidates(data);
      setError(null);
    } catch (err) {
      console.error('Error loading candidates:', err);
      debug.error("Error loading candidates", err);
      
      // Provide more specific error message based on error type
      const errorMessage = err instanceof Error && err.message.includes('index') 
        ? 'Index error: Please set up the required Firestore index. Check the Setup Guide for instructions.'
        : 'Failed to load candidates. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Load candidates on mount
  useEffect(() => {
    loadCandidates();
  }, []);
  
  // Handle candidate selection for comparison
  const handleCandidateSelect = (candidate: Candidate) => {
    if (selectedCandidates.some(c => c.id === candidate.id)) {
      // Already selected, remove it
      setSelectedCandidates(selectedCandidates.filter(c => c.id !== candidate.id));
    } else {
      // Add to selection (up to 3 candidates)
      if (selectedCandidates.length < 3) {
        setSelectedCandidates([...selectedCandidates, candidate]);
      } else {
        alert('You can compare up to 3 candidates at a time.');
      }
    }
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedCandidates([]);
  };
  
  // Show comparison modal
  const openComparison = () => {
    if (selectedCandidates.length >= 2) {
      setShowComparison(true);
    } else {
      alert('Please select at least 2 candidates to compare.');
    }
  };
  
  // Close comparison modal
  const closeComparison = () => {
    setShowComparison(false);
  };
  
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Junior IT Hiring Manager</h1>
            <div className="flex space-x-3 items-center">
              <Link
                href="/setup-guide"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Setup Guide
              </Link>
              {user && (
                <Link
                  href="/candidates/new"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Candidate
                </Link>
              )}
              <AuthStatus />
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user && !authLoading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access the candidate management system.
            </p>
            <Link
              href="/auth"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Selection Controls */}
            {selectedCandidates.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium">{selectedCandidates.length} candidates selected</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {selectedCandidates.map(c => c.name).join(', ')}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={openComparison}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={selectedCandidates.length < 2}
                  >
                    Compare Selected
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            
            {/* Candidate List Component */}
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="rounded-lg overflow-hidden border border-red-200">
                <div className="bg-red-50 text-red-600 p-4">
                  <h3 className="text-lg font-medium text-red-700 mb-2">Error Loading Candidates</h3>
                  <p className="mb-3">{error}</p>
                  {error && error.includes('index') && (
                    <div className="mb-3">
                      <p className="font-medium">Firebase Index Error Detected</p>
                      <p className="text-sm">You need to create a composite index in Firestore. Click the setup guide button for instructions.</p>
                    </div>
                  )}
                  <div className="flex space-x-3 mt-4">
                    <button 
                      onClick={() => loadCandidates()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <Link
                      href="/setup-guide"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      View Setup Guide
                    </Link>
                  </div>
                </div>
              </div>
            ) : candidates.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Click on a candidate to select them for comparison or use the "View Details" button to see their full profile.
                </p>
                <CandidateList 
                  initialCandidates={candidates}
                  onCandidateSelect={handleCandidateSelect}
                />
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm">
                No candidates found. Please add a new candidate.
              </p>
            )}
            
            {/* Comparison Modal */}
            {showComparison && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="w-full max-w-6xl max-h-[90vh] overflow-auto m-4">
                  <CandidateComparison
                    candidates={selectedCandidates}
                    onClose={closeComparison}
                  />
                </div>
              </div>
            )}
          </>
        )}
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
