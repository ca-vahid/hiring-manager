export type AIModel = 'openai' | 'gemini';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  pictureUrl?: string;
  starRating: number;
  status: 'Active' | 'Inactive';
  createdAt: number;
  updatedAt: number;
  scores: CategoryScores;
  overallScore: number;
  documents: CandidateDocuments;
}

export interface CategoryScores {
  technicalSkills: number;
  communicationSkills: number;
  experience: number;
  culturalFit: number;
  [key: string]: number; // Allow for custom categories
}

export interface CategoryWeights {
  technicalSkills: number;
  communicationSkills: number;
  experience: number;
  culturalFit: number;
  [key: string]: number; // Allow for custom categories
}

export interface CandidateDocuments {
  resume?: DocumentInfo;
  coverLetter?: DocumentInfo;
  notes?: DocumentInfo[];
  transcripts?: DocumentInfo[];
}

export interface DocumentInfo {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: number;
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  summary?: string;
  extractedSkills?: string[];
  extractedEducation?: string[];
  extractedExperience?: string[];
  suggestedScores?: CategoryScores;
  model: AIModel;
  generatedAt: number;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  status?: 'Active' | 'Inactive' | 'All';
  minScore?: number;
  maxScore?: number;
  searchTerm?: string;
} 