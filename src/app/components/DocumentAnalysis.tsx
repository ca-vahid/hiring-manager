'use client';

import { useState, useCallback } from 'react';
import { DocumentInfo, AIModel, AIAnalysis, CategoryScores } from '../lib/types';
import { analyzeDocument } from '../lib/ai/aiService';
import { debug } from '../lib/debug';

interface DocumentAnalysisProps {
  document: DocumentInfo;
  onAnalysisComplete: (documentId: string, analysis: AIAnalysis) => void;
  onUpdateScores?: (scores: CategoryScores) => void;
}

const DocumentAnalysis = ({
  document,
  onAnalysisComplete,
  onUpdateScores,
}: DocumentAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState<{ [key in AIModel]?: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  
  // Get document content from URL
  const fetchDocumentContent = useCallback(async (url: string): Promise<string> => {
    const response = await fetch(url);
    
    // Check if it's a PDF or another binary format
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/pdf')) {
      // For PDF files, we would need a PDF parser, but for now return an error
      throw new Error('PDF analysis is not yet supported. Please upload a text-based document.');
    }
    
    return await response.text();
  }, []);
  
  // Analyze document with specified AI model
  const analyzeWithModel = useCallback(async (model: AIModel) => {
    debug.info(`Starting document analysis with ${model.toUpperCase()}`, {
      documentId: document.id,
      fileName: document.name
    });
    
    setIsAnalyzing(prev => ({ ...prev, [model]: true }));
    setError(null);
    
    try {
      // Get document content
      debug.info("Fetching document content");
      const content = await fetchDocumentContent(document.url);
      
      // Send to analysis service
      debug.info(`Sending content to ${model} analysis service`);
      const analysis = await analyzeDocument({
        fileContent: content,
        fileName: document.name,
        fileType: document.type,
        model,
      });
      
      debug.success(`${model.toUpperCase()} analysis completed successfully`);
      
      // Update parent component
      onAnalysisComplete(document.id, analysis);
      
      // If there are suggested scores and onUpdateScores handler, call it
      if (analysis.suggestedScores && onUpdateScores) {
        debug.info("Updating candidate scores based on AI analysis");
        onUpdateScores(analysis.suggestedScores);
      }
      
      return analysis;
    } catch (err: any) {
      console.error(`Error analyzing document with ${model}:`, err);
      debug.error(`${model.toUpperCase()} analysis failed`, err);
      setError(err.message || `Failed to analyze document with ${model}`);
      return null;
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [model]: false }));
    }
  }, [document, onAnalysisComplete, onUpdateScores, fetchDocumentContent]);
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  // Get analysis results for display
  const getAnalysisResults = () => {
    if (!document.aiAnalysis) return null;
    
    const { summary, extractedSkills, extractedEducation, extractedExperience, model, generatedAt } = document.aiAnalysis;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-md font-medium">AI Analysis Results ({model.toUpperCase()})</h4>
          <span className="text-xs text-gray-500">Generated: {formatDate(generatedAt)}</span>
        </div>
        
        {summary && (
          <div className="mb-3">
            <h5 className="text-sm font-medium mb-1">Summary</h5>
            <p className="text-sm text-gray-700">{summary}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {extractedSkills && extractedSkills.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">Skills</h5>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {extractedSkills.slice(0, 10).map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
                {extractedSkills.length > 10 && <li>+{extractedSkills.length - 10} more</li>}
              </ul>
            </div>
          )}
          
          {extractedEducation && extractedEducation.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">Education</h5>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {extractedEducation.slice(0, 5).map((education, index) => (
                  <li key={index}>{education}</li>
                ))}
                {extractedEducation.length > 5 && <li>+{extractedEducation.length - 5} more</li>}
              </ul>
            </div>
          )}
          
          {extractedExperience && extractedExperience.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">Experience</h5>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {extractedExperience.slice(0, 5).map((experience, index) => (
                  <li key={index}>{experience}</li>
                ))}
                {extractedExperience.length > 5 && <li>+{extractedExperience.length - 5} more</li>}
              </ul>
            </div>
          )}
        </div>
        
        {document.aiAnalysis.suggestedScores && (
          <div className="mt-3">
            <h5 className="text-sm font-medium mb-1">Suggested Scores</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(document.aiAnalysis.suggestedScores).map(([category, score]) => (
                <div key={category} className="bg-white rounded p-2 border border-gray-200">
                  <div className="text-xs text-gray-600">
                    {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className="text-lg font-medium">{score}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="my-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-2">
        <h3 className="text-lg font-medium">Document Analysis</h3>
        
        <div className="flex flex-col xs:flex-row gap-2">
          <button
            onClick={() => analyzeWithModel('openai')}
            disabled={isAnalyzing.openai}
            className={`
              px-3 py-2 rounded-md text-sm
              ${isAnalyzing.openai 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'}
              transition-colors
            `}
          >
            {isAnalyzing.openai 
              ? 'Analyzing with OpenAI...' 
              : document.aiAnalysis?.model === 'openai' 
                ? 'Re-analyze with OpenAI' 
                : 'Analyze with OpenAI'}
          </button>
          
          <button
            onClick={() => analyzeWithModel('gemini')}
            disabled={isAnalyzing.gemini}
            className={`
              px-3 py-2 rounded-md text-sm
              ${isAnalyzing.gemini 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'}
              transition-colors
            `}
          >
            {isAnalyzing.gemini 
              ? 'Analyzing with Gemini...' 
              : document.aiAnalysis?.model === 'gemini' 
                ? 'Re-analyze with Gemini' 
                : 'Analyze with Gemini'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {document.aiAnalysis ? getAnalysisResults() : (
        <div className="p-4 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-center">
          Click one of the analyze buttons to extract insights from this document using AI.
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis; 