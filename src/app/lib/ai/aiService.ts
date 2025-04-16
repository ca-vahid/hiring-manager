import { AIAnalysis, AIModel, CategoryScores } from '../types';

// Global interface for document analysis requests
export interface DocumentAnalysisRequest {
  fileContent: string;
  fileName: string;
  fileType: string;
  model: AIModel;
}

// Interface for the response from AI analysis
export interface DocumentAnalysisResponse {
  summary: string;
  extractedSkills: string[];
  extractedEducation: string[];
  extractedExperience: string[];
  suggestedScores: CategoryScores;
}

/**
 * Analyze a document using the specified AI model
 */
export const analyzeDocument = async (request: DocumentAnalysisRequest): Promise<AIAnalysis> => {
  const { model } = request;
  
  let response: DocumentAnalysisResponse;
  
  if (model === 'openai') {
    response = await analyzeWithOpenAI(request);
  } else if (model === 'gemini') {
    response = await analyzeWithGemini(request);
  } else {
    throw new Error(`Unsupported AI model: ${model}`);
  }
  
  return {
    ...response,
    model,
    generatedAt: Date.now()
  };
};

/**
 * Analyze document with OpenAI
 */
const analyzeWithOpenAI = async (request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> => {
  const { fileContent, fileName, fileType } = request;
  
  try {
    const response = await fetch('/api/openai/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: fileContent,
        fileName,
        fileType
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI analysis failed: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing document with OpenAI:', error);
    throw error;
  }
};

/**
 * Analyze document with Gemini
 */
const analyzeWithGemini = async (request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> => {
  const { fileContent, fileName, fileType } = request;
  
  try {
    const response = await fetch('/api/gemini/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: fileContent,
        fileName,
        fileType
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini analysis failed: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing document with Gemini:', error);
    throw error;
  }
};

/**
 * Compare candidates using the specified AI model
 */
export const compareWithAI = async (
  candidates: {
    id: string;
    name: string;
    documents: {
      resume?: { url: string; name: string; type: string; };
      coverLetter?: { url: string; name: string; type: string; };
    };
    scores: CategoryScores;
  }[],
  jobDescription: string,
  model: AIModel
): Promise<string> => {
  try {
    const endpoint = model === 'openai' 
      ? '/api/openai/compare-candidates'
      : '/api/gemini/compare-candidates';
      
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidates,
        jobDescription
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI comparison failed: ${error}`);
    }
    
    const result = await response.json();
    return result.analysis;
  } catch (error) {
    console.error(`Error comparing candidates with ${model}:`, error);
    throw error;
  }
}; 