'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCandidate, updateCandidate, calculateOverallScore } from '../lib/candidateUtils';
import { Candidate, CategoryScores } from '../lib/types';
import StarRating from './StarRating';
import { DEFAULT_WEIGHTS } from '../lib/candidateUtils';
import { debug } from '../lib/debug';

interface CandidateFormProps {
  initialData?: Partial<Candidate>;
  isEditing?: boolean;
}

const CandidateForm = ({
  initialData,
  isEditing = false,
}: CandidateFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Candidate>>({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    pictureUrl: '',
    starRating: 0,
    status: 'Active',
    scores: {
      technicalSkills: 0,
      communicationSkills: 0,
      experience: 0,
      culturalFit: 0,
    },
    documents: {
      resume: undefined,
      coverLetter: undefined,
      notes: [],
      transcripts: [],
    },
    ...initialData,
  });
  
  // Star rating
  const handleStarRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      starRating: rating,
    }));
  };
  
  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Score change handler
  const handleScoreChange = (category: keyof CategoryScores, value: number) => {
    const newScores = {
      ...(formData.scores as CategoryScores),
      [category]: value,
    };
    
    const overallScore = calculateOverallScore(newScores, DEFAULT_WEIGHTS);
    
    setFormData(prev => ({
      ...prev,
      scores: newScores,
      overallScore,
    }));
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      
      // Make sure documents is properly structured to avoid Firebase errors
      const safeFormData = {
        ...formData,
        documents: {
          resume: formData.documents?.resume || undefined,
          coverLetter: formData.documents?.coverLetter || undefined,
          notes: formData.documents?.notes || [],
          transcripts: formData.documents?.transcripts || [],
        }
      };
      
      debug.info(`${isEditing ? 'Updating' : 'Creating'} candidate`, { 
        id: formData.id, 
        name: formData.name 
      });
      
      if (isEditing && formData.id) {
        // Update existing candidate
        await updateCandidate(formData.id, {
          ...safeFormData,
          updatedAt: timestamp,
        });
        debug.success(`Candidate updated: ${formData.id}`);
      } else {
        // Create new candidate
        await createCandidate({
          ...safeFormData as Omit<Candidate, 'id'>,
          createdAt: timestamp,
          updatedAt: timestamp,
          overallScore: calculateOverallScore(formData.scores as CategoryScores, DEFAULT_WEIGHTS),
        });
        debug.success("New candidate created");
      }
      
      // Redirect to candidates list
      router.push('/candidates');
      
    } catch (err) {
      console.error('Error saving candidate:', err);
      debug.error("Error saving candidate", err);
      setError('Failed to save candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-medium mb-6">
        {isEditing ? 'Edit Candidate' : 'Add New Candidate'}
      </h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'Active'}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Professional Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Professional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin || ''}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/username"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                id="github"
                name="github"
                value={formData.github || ''}
                onChange={handleInputChange}
                placeholder="https://github.com/username"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="pictureUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture URL
              </label>
              <input
                type="url"
                id="pictureUrl"
                name="pictureUrl"
                value={formData.pictureUrl || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Impression Rating
              </label>
              <StarRating 
                value={formData.starRating || 0} 
                onChange={handleStarRatingChange} 
              />
            </div>
          </div>
        </div>
        
        {/* Candidate Scores */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Candidate Scores</h3>
          <p className="text-sm text-gray-600 mb-4">
            Rate the candidate on a scale of 1-10 for each category
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(DEFAULT_WEIGHTS).map(([category, weight]) => (
              <div key={category} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={category} className="text-sm font-medium text-gray-700">
                    {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ({weight * 100}%)
                  </label>
                  <span className="text-sm font-medium text-gray-700">
                    {formData.scores?.[category as keyof CategoryScores] || 0}/10
                  </span>
                </div>
                <input
                  type="range"
                  id={category}
                  min="0"
                  max="10"
                  step="1"
                  value={formData.scores?.[category as keyof CategoryScores] || 0}
                  onChange={(e) => handleScoreChange(category as keyof CategoryScores, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Overall Score:</span>
              <span className="text-lg font-semibold text-blue-600">
                {calculateOverallScore(formData.scores as CategoryScores, DEFAULT_WEIGHTS)}/10
              </span>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`
              px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors
              ${loading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Candidate' : 'Add Candidate'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandidateForm; 