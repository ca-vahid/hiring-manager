import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CategoryScores } from '@/app/lib/types';
import { debug } from '@/app/lib/debug';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  debug.info("Gemini analyze-document API called");
  
  try {
    const { content, fileName, fileType } = await req.json();
    debug.info(`Analyzing document with Gemini: ${fileName}`, { type: fileType, contentLength: content?.length || 0 });

    if (!content) {
      debug.error("Content is required for document analysis");
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Use Gemini Pro for complex analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    debug.info("Using Gemini Pro model");

    const prompt = `
      You are an expert HR assistant analyzing documents for a job candidate. 
      I'm going to provide you with a document that could be a resume, cover letter, or interview transcript.

      Please analyze this document and provide the following:
      1. A concise summary (max 200 words)
      2. A list of extracted technical skills
      3. A list of extracted education details
      4. A list of extracted work experience
      5. Suggested scores on a scale of 1-10 for the following categories:
         - Technical Skills
         - Communication Skills
         - Experience
         - Cultural Fit

      Document name: ${fileName}
      Document type: ${fileType}
      Document content:
      ${content}

      Format your response as a JSON object with the following structure:
      {
        "summary": "...",
        "extractedSkills": ["skill1", "skill2", ...],
        "extractedEducation": ["education1", "education2", ...],
        "extractedExperience": ["experience1", "experience2", ...],
        "suggestedScores": {
          "technicalSkills": X,
          "communicationSkills": X,
          "experience": X,
          "culturalFit": X
        }
      }

      Ensure all scores are between 1 and 10, with 10 being the highest possible rating.
      Return ONLY the JSON object with no additional text.
    `;

    debug.info("Sending request to Gemini API");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    debug.success("Received response from Gemini API");
    
    try {
      debug.info("Processing Gemini response");
      // Extract JSON from response if it's wrapped in code blocks
      let jsonText = resultText;
      if (resultText.includes('```json')) {
        debug.info("Extracting JSON from code block (```json)");
        jsonText = resultText.split('```json')[1].split('```')[0].trim();
      } else if (resultText.includes('```')) {
        debug.info("Extracting JSON from generic code block (```)");
        jsonText = resultText.split('```')[1].split('```')[0].trim();
      }
      
      debug.info("Parsing Gemini response JSON");
      const resultObj = JSON.parse(jsonText);
      
      // Ensure all required fields are present
      const validatedResult = {
        summary: resultObj.summary || '',
        extractedSkills: resultObj.extractedSkills || [],
        extractedEducation: resultObj.extractedEducation || [],
        extractedExperience: resultObj.extractedExperience || [],
        suggestedScores: resultObj.suggestedScores || {
          technicalSkills: 5,
          communicationSkills: 5,
          experience: 5,
          culturalFit: 5,
        } as CategoryScores,
      };
      
      debug.success("Successfully analyzed document with Gemini");
      return NextResponse.json(validatedResult);
    } catch (parseError) {
      debug.error('Error parsing Gemini response:', parseError);
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', resultText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    debug.error('Gemini API error:', error);
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze document' },
      { status: 500 }
    );
  }
} 