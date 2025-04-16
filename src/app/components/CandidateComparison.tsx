'use client';

import { useState } from 'react';
import { Candidate, AIModel } from '../lib/types';
import { compareWithAI } from '../lib/ai/aiService';
import StarRating from './StarRating';

interface CandidateComparisonProps {
  candidates: Candidate[];
  onClose: () => void;
}

const CandidateComparison = ({
  candidates,
  onClose,
}: CandidateComparisonProps) => {
  const [jobDescription, setJobDescription] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; model: AIModel } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<{ [key in AIModel]?: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Generate comparison with AI
  const generateComparison = async (model: AIModel) => {
    if (!jobDescription) {
      setError('Please enter a job description to compare against.');
      return;
    }
    
    setIsAnalyzing({ ...isAnalyzing, [model]: true });
    setError(null);
    
    try {
      // Format candidate data for AI comparison
      const candidateData = candidates.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        documents: {
          resume: candidate.documents.resume,
          coverLetter: candidate.documents.coverLetter,
        },
        scores: candidate.scores,
      }));
      
      // Call AI service
      const analysis = await compareWithAI(candidateData, jobDescription, model);
      
      // Update state
      setAiAnalysis({
        text: analysis,
        model,
      });
    } catch (err: any) {
      console.error(`Error generating comparison with ${model}:`, err);
      setError(err.message || `Failed to generate comparison with ${model}`);
    } finally {
      setIsAnalyzing({ ...isAnalyzing, [model]: false });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Candidate Comparison</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Job Description Input */}
      <div className="mb-6">
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Job Description (for AI comparison)
        </label>
        <textarea
          id="jobDescription"
          rows={5}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to generate an AI-powered comparison..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="flex justify-end mt-2 gap-2">
          <button
            onClick={() => generateComparison('openai')}
            disabled={!jobDescription || isAnalyzing.openai || isAnalyzing.gemini}
            className={`
              px-3 py-2 rounded-md text-sm
              ${!jobDescription || isAnalyzing.openai || isAnalyzing.gemini
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'}
              transition-colors
            `}
          >
            {isAnalyzing.openai ? 'Comparing with OpenAI...' : 'Compare with OpenAI'}
          </button>
          
          <button
            onClick={() => generateComparison('gemini')}
            disabled={!jobDescription || isAnalyzing.openai || isAnalyzing.gemini}
            className={`
              px-3 py-2 rounded-md text-sm
              ${!jobDescription || isAnalyzing.openai || isAnalyzing.gemini
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'}
              transition-colors
            `}
          >
            {isAnalyzing.gemini ? 'Comparing with Gemini...' : 'Compare with Gemini'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left border border-gray-200 text-sm font-medium text-gray-700">Criteria</th>
              {candidates.map((candidate) => (
                <th key={candidate.id} className="p-3 text-left border border-gray-200 text-sm font-medium text-gray-700">
                  {candidate.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Basic Info */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Contact</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  <div>{candidate.email}</div>
                  {candidate.phone && <div>{candidate.phone}</div>}
                </td>
              ))}
            </tr>
            
            {/* Status */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Status</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    candidate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {candidate.status}
                  </span>
                </td>
              ))}
            </tr>
            
            {/* Updated At */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Last Updated</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  {formatDate(candidate.updatedAt)}
                </td>
              ))}
            </tr>
            
            {/* Rating */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Rating</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200">
                  <StarRating value={candidate.starRating} onChange={() => {}} disabled size="sm" />
                </td>
              ))}
            </tr>
            
            {/* Overall Score */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Overall Score</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200">
                  <span className={`text-lg font-semibold ${
                    candidate.overallScore >= 80 ? 'text-green-600' :
                    candidate.overallScore >= 60 ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {candidate.overallScore}/100
                  </span>
                </td>
              ))}
            </tr>
            
            {/* Technical Skills */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Technical Skills</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  {candidate.scores.technicalSkills}/10
                </td>
              ))}
            </tr>
            
            {/* Communication Skills */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Communication Skills</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  {candidate.scores.communicationSkills}/10
                </td>
              ))}
            </tr>
            
            {/* Experience */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Experience</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  {candidate.scores.experience}/10
                </td>
              ))}
            </tr>
            
            {/* Cultural Fit */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Cultural Fit</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  {candidate.scores.culturalFit}/10
                </td>
              ))}
            </tr>
            
            {/* Documents */}
            <tr>
              <td className="p-3 border border-gray-200 bg-gray-50 text-sm font-medium">Documents</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 border border-gray-200 text-sm">
                  <div className="flex flex-wrap gap-1">
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
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">AI Comparison ({aiAnalysis.model.toUpperCase()})</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            {aiAnalysis.text.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateComparison; 