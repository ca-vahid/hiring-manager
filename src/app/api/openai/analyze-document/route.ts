import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CategoryScores } from '@/app/lib/types';
import { debug } from '@/app/lib/debug';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  debug.info("OpenAI analyze-document API called");
  
  if (!process.env.OPENAI_API_KEY) {
    debug.error("OPENAI_API_KEY environment variable is missing");
    return NextResponse.json(
      { error: 'OpenAI API key is missing', configError: true },
      { status: 500 }
    );
  }
  
  try {
    const { content, fileName, fileType } = await req.json();
    debug.info(`Analyzing document: ${fileName}`, { type: fileType, contentLength: content?.length || 0 });

    if (!content) {
      debug.error("Content is required for document analysis");
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const model = 'gpt-4-turbo';
    debug.info(`Using OpenAI model: ${model}`);

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
    `;

    debug.info("Sending request to OpenAI API", { 
      apiKey: process.env.OPENAI_API_KEY ? "Set (first 3 chars: " + process.env.OPENAI_API_KEY.substring(0, 3) + "...)" : "Not set",
      model 
    });
    
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful HR assistant that analyzes candidate documents.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const resultText = response.choices[0]?.message?.content || '';
      debug.success("Received response from OpenAI");
      
      try {
        debug.info("Parsing OpenAI response JSON");
        const result = JSON.parse(resultText);
        
        // Ensure all required fields are present
        const validatedResult = {
          summary: result.summary || '',
          extractedSkills: result.extractedSkills || [],
          extractedEducation: result.extractedEducation || [],
          extractedExperience: result.extractedExperience || [],
          suggestedScores: result.suggestedScores || {
            technicalSkills: 5,
            communicationSkills: 5,
            experience: 5,
            culturalFit: 5,
          } as CategoryScores,
        };
        
        debug.success("Successfully analyzed document with OpenAI");
        return NextResponse.json(validatedResult);
      } catch (parseError) {
        debug.error('Error parsing OpenAI response:', parseError);
        console.error('Raw response text:', resultText);
        return NextResponse.json(
          { error: 'Failed to parse AI response', details: { message: (parseError as Error).message, rawResponse: resultText.substring(0, 200) + '...' } },
          { status: 500 }
        );
      }
    } catch (apiError: any) {
      debug.error('OpenAI API request error:', { 
        message: apiError.message, 
        status: apiError.status,
        type: apiError.type,
        code: apiError.code
      });
      
      return NextResponse.json(
        { 
          error: 'OpenAI API request failed', 
          details: { 
            message: apiError.message,
            status: apiError.status,
            type: apiError.type,
            code: apiError.code
          }
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    debug.error('Unexpected error in OpenAI analyze-document API:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: { message: error.message || 'Unknown error' } },
      { status: 500 }
    );
  }
} 