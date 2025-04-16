import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { candidates, jobDescription } = await req.json();

    if (!candidates || !Array.isArray(candidates) || candidates.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 candidates are required for comparison' },
        { status: 400 }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Use Gemini Pro for complex analysis tasks
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Format candidate data for the prompt
    const candidatesFormatted = candidates.map((candidate, index) => {
      return `
      Candidate ${index + 1}: ${candidate.name}
      ${candidate.documents.resume ? `Has Resume: Yes` : `Has Resume: No`}
      ${candidate.documents.coverLetter ? `Has Cover Letter: Yes` : `Has Cover Letter: No`}
      Scores:
      - Technical Skills: ${candidate.scores.technicalSkills}/10
      - Communication Skills: ${candidate.scores.communicationSkills}/10
      - Experience: ${candidate.scores.experience}/10
      - Cultural Fit: ${candidate.scores.culturalFit}/10
      `;
    }).join('\n');

    const prompt = `
      You are an expert HR advisor helping to compare candidates for a Junior IT position.
      
      Job Description:
      ${jobDescription}
      
      Candidates to compare:
      ${candidatesFormatted}
      
      Please provide a detailed comparison of these candidates based on their scores and available documents.
      Include the following in your analysis:
      
      1. Strengths and weaknesses of each candidate
      2. How well each candidate matches the job description
      3. A ranking of the candidates from most to least suitable
      4. Key differentiating factors between candidates
      5. Final recommendation on which candidate(s) to prioritize for the next steps
      
      Provide an objective, fair, and comprehensive analysis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compare candidates' },
      { status: 500 }
    );
  }
} 