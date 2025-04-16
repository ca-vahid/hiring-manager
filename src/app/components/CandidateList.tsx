'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCandidates } from '../lib/candidateUtils';
import { Candidate, FilterOptions, SortOption } from '../lib/types';
import StarRating from './StarRating';

interface CandidateListProps {
  initialCandidates?: Candidate[];
  onCandidateSelect?: (candidate: Candidate) => void;
}

const CandidateList = ({
  initialCandidates,
  onCandidateSelect,
}: CandidateListProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates || []);
  const [loading, setLoading] = useState(!initialCandidates);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering state
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'Active',
    minScore: undefined,
    maxScore: undefined,
    searchTerm: '',
  });
  
  // Sorting state
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'updatedAt',
    direction: 'desc',
  });
  
  // Available score ranges
  const scoreRanges = [
    { label: 'All Scores', minScore: undefined, maxScore: undefined },
    { label: '90-100', minScore: 90, maxScore: 100 },
    { label: '80-89', minScore: 80, maxScore: 89 },
    { label: '70-79', minScore: 70, maxScore: 79 },
    { label: 'Below 70', minScore: 0, maxScore: 69 },
  ];
  
  // Available sort options
  const sortOptions = [
    { label: 'Last Updated', field: 'updatedAt', direction: 'desc' as const },
    { label: 'Name (A-Z)', field: 'name', direction: 'asc' as const },
    { label: 'Name (Z-A)', field: 'name', direction: 'desc' as const },
    { label: 'Score (High-Low)', field: 'overallScore', direction: 'desc' as const },
    { label: 'Score (Low-High)', field: 'overallScore', direction: 'asc' as const },
    { label: 'Rating (High-Low)', field: 'starRating', direction: 'desc' as const },
  ];
  
  // Load candidates on mount if not provided
  useEffect(() => {
    if (!initialCandidates) {
      loadCandidates();
    }
  }, [initialCandidates]);
  
  // Load candidates with current filters and sort
  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCandidates(filters, sortOption);
      setCandidates(data);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update filters and reload candidates
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Apply filters and sort
  const handleApplyFilters = () => {
    loadCandidates();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: 'Active',
      minScore: undefined,
      maxScore: undefined,
      searchTerm: '',
    });
    setSortOption({
      field: 'updatedAt',
      direction: 'desc',
    });
  };
  
  // Handle candidate selection
  const handleCandidateClick = (candidate: Candidate) => {
    if (onCandidateSelect) {
      onCandidateSelect(candidate);
    } else {
      // Navigate to candidate detail page
      window.location.href = `/candidates/${candidate.id}`;
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
  
  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-medium">Candidates</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Name, email, etc."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={filters.status || 'All'}
              onChange={(e) => updateFilters({ status: e.target.value as 'Active' | 'Inactive' | 'All' })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          {/* Score Range Filter */}
          <div>
            <label htmlFor="scoreRange" className="block text-sm font-medium text-gray-700 mb-1">
              Score Range
            </label>
            <select
              id="scoreRange"
              value={filters.minScore !== undefined ? `${filters.minScore}-${filters.maxScore}` : ''}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                updateFilters({ minScore: min || undefined, maxScore: max || undefined });
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {scoreRanges.map((range, index) => (
                <option 
                  key={index} 
                  value={range.minScore !== undefined ? `${range.minScore}-${range.maxScore}` : ''}
                >
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort Options */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={`${sortOption.field}-${sortOption.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortOption({ 
                  field, 
                  direction: direction as 'asc' | 'desc' 
                });
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option, index) => (
                <option 
                  key={index} 
                  value={`${option.field}-${option.direction}`}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Candidate List */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">
          {error}
          <button 
            onClick={loadCandidates}
            className="ml-2 underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No candidates found</p>
          <Link 
            href="/candidates/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Add Candidate
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {candidates.map((candidate) => (
            <div 
              key={candidate.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={() => handleCandidateClick(candidate)}
            >
              {/* Add a View Details button */}
              <div className="absolute top-4 right-4">
                <Link 
                  href={`/candidates/${candidate.id}`}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0">
                  {candidate.pictureUrl ? (
                    <Image
                      src={candidate.pictureUrl}
                      alt={candidate.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{candidate.name}</h3>
                      <p className="text-gray-600 text-sm">{candidate.email}</p>
                      {candidate.phone && (
                        <p className="text-gray-600 text-sm">{candidate.phone}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        candidate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.status}
                      </span>
                      <span className="mt-1 text-sm text-gray-500">
                        Updated: {formatDate(candidate.updatedAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <StarRating value={candidate.starRating} onChange={() => {}} disabled size="sm" />
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Score:</span>
                      <span className={`text-sm font-medium ${
                        candidate.overallScore >= 80 ? 'text-green-600' :
                        candidate.overallScore >= 60 ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {candidate.overallScore}/100
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.documents.resume && (
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">Resume</span>
                    )}
                    {candidate.documents.coverLetter && (
                      <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">Cover Letter</span>
                    )}
                    {candidate.documents.notes && candidate.documents.notes.length > 0 && (
                      <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded">
                        Notes ({candidate.documents.notes.length})
                      </span>
                    )}
                    {candidate.documents.transcripts && candidate.documents.transcripts.length > 0 && (
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                        Transcripts ({candidate.documents.transcripts.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateList; 