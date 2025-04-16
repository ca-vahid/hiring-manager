import { AIAnalysis, AIModel, CategoryScores } from '../types';
import { debug, loggedApiCall } from '@/lib/debug';

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
  
  debug.info(`Starting document analysis with ${model.toUpperCase()}`, {
    fileName: request.fileName,
    contentLength: request.fileContent.length,
    fileType: request.fileType
  });
  
  let response: DocumentAnalysisResponse;
  
  try {
    if (model === 'openai') {
      response = await analyzeWithOpenAI(request);
    } else if (model === 'gemini') {
      response = await analyzeWithGemini(request);
    } else {
      throw new Error(`Unsupported AI model: ${model}`);
    }
    
    debug.success(`${model.toUpperCase()} analysis completed successfully`);
    
    return {
      ...response,
      model,
      generatedAt: Date.now()
    };
  } catch (error) {
    debug.error(`${model.toUpperCase()} analysis failed`, error);
    throw error;
  }
};

/**
 * Analyze document with OpenAI
 */
const analyzeWithOpenAI = async (request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> => {
  const { fileContent, fileName, fileType } = request;
  
  debug.info(`Sending content to OpenAI for analysis (${fileName})`);
  
  try {
    return await loggedApiCall<DocumentAnalysisResponse>(
      '/api/openai/analyze-document',
      'POST',
      {
        content: fileContent,
        fileName,
        fileType
      }
    );
  } catch (error) {
    debug.error('Error analyzing document with OpenAI:', error);
    throw error;
  }
};

/**
 * Analyze document with Gemini
 */
const analyzeWithGemini = async (request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> => {
  const { fileContent, fileName, fileType } = request;
  
  debug.info(`Sending content to Gemini for analysis (${fileName})`);
  
  try {
    return await loggedApiCall<DocumentAnalysisResponse>(
      '/api/gemini/analyze-document',
      'POST',
      {
        content: fileContent,
        fileName,
        fileType
      }
    );
  } catch (error) {
    debug.error('Error analyzing document with Gemini:', error);
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
  const endpoint = model === 'openai' 
    ? '/api/openai/compare-candidates'
    : '/api/gemini/compare-candidates';
  
  debug.info(`Starting candidate comparison with ${model.toUpperCase()}`, {
    candidateCount: candidates.length,
    jobDescriptionLength: jobDescription.length
  });
  
  try {
    const result = await loggedApiCall<{ analysis: string }>(
      endpoint,
      'POST',
      {
        candidates,
        jobDescription
      }
    );
    
    debug.success(`${model.toUpperCase()} comparison completed successfully`);
    return result.analysis;
  } catch (error) {
    debug.error(`Error comparing candidates with ${model}:`, error);
    throw error;
  }
}; 