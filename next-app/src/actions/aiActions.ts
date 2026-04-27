"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIAnalysisResult {
  success: boolean;
  error?: string;
  matchScore?: number;
  missingKeywords?: string[];
  matchingKeywords?: string[];
  recommendation?: string;
}

export async function analyzeResumeMatch(jobDescription: string, resumeText: string): Promise<AIAnalysisResult> {
  // AI Endpoints are completely stateless and do not read/write to Firestore.
  // Legacy NextAuth session blocking decommissioned for Firebase compatibility.

  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Configuration Error: GEMINI_API_KEY is missing from the environment." };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert Technical Recruiter and Applicant Tracking System (ATS).
      Analyze the following Job Description and the candidate's Resume.
      
      Calculate a match score from 0 to 100 based on skill overlap and experience.
      Identify exact keywords present in the JD but missing from the resume.
      Identify matching keywords.
      Provide a 1-2 sentence recommendation on how to improve the resume for this specific role.

      Return ONLY a valid JSON object matching this exact schema:
      {
        "matchScore": 80, 
        "missingKeywords": ["keyword1", "keyword2"],
        "matchingKeywords": ["keyword1", "keyword2"],
        "recommendation": "string"
      }
      IMPORTANT: "matchScore" MUST be an Integer between 0 and 100. Do NOT include a % sign.

      Job Description:
      """${jobDescription}"""

      Resume:
      """${resumeText}"""
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // The response is guaranteed to be JSON string due to responseMimeType
    const analysis = JSON.parse(responseText);
    
    // Safety check coercion to Number just in case Gemini hallucinates a string percentage
    const safeScore = Number(String(analysis.matchScore).replace(/[^0-9]/g, '')) || 0;
    
    return {
      success: true,
      matchScore: safeScore,
      missingKeywords: analysis.missingKeywords || [],
      matchingKeywords: analysis.matchingKeywords || [],
      recommendation: analysis.recommendation || ''
    };
  } catch (error: any) {
    console.error("AI Analysis Failed:", error);
    return { 
      success: false, 
      error: error.message || "The AI server failed to process the request. Try again." 
    };
  }
}

export async function generateInterviewQuestions(jobDescription: string, resumeText: string, numQuestions: number = 5) {

  if (!process.env.GEMINI_API_KEY) return { success: false, error: "Missing API Key" };

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" }});
    const prompt = `
      Act as an expert technical interviewer.
      Given the candidate's Resume and the target Job Description, generate ${numQuestions} highly specific, challenging interview questions that this specific candidate is likely to be asked.
      
      Job Description:
      """${jobDescription}"""
      
      Resume:
      """${resumeText}"""
      
      Return ONLY a valid JSON object:
      {
        "questions": [
          {
            "question": "The specific interview question",
            "reasoning": "Why this question is relevant based on their resume vs the JD",
            "tips": "Tips on how to answer it well"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    return { success: true, data: JSON.parse(result.response.text()) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function evaluateVoiceAnswer(question: string, answer: string) {

  if (!process.env.GEMINI_API_KEY) return { success: false, error: "Missing API Key" };

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" }});
    
    // If the user says basically nothing or "I don't know"
    if (!answer || answer.trim().length < 10 || answer.toLowerCase().includes("i don't know")) {
       return { success: true, data: { score: 0, feedback: "It seems you didn't provide a complete answer. Try to discuss any related experience, even if you don't know the exact textbook answer." } };
    }

    const prompt = `
      You are an expert Principal Engineer and Recruiter evaluating a candidate's verbal response to your interview question.
      
      Question asked: "${question}"
      Candidate's spoken answer (transcribed via Speech-to-Text): "${answer}"
      
      Provide a detailed critique based on relevance, completeness, communication clarity, and technical depth.
      Instead of just a simple score, write a comprehensive breakdown.
      
      Return ONLY a valid JSON object matching this schema exactly:
      {
        "score": 85,
        "feedback": "A comprehensive paragraph explaining what they did well and where they missed the mark.",
        "pros": ["Pro 1", "Pro 2"],
        "cons": ["Area to improve 1", "Area to improve 2"],
        "idealAnswer": "Provide a concise example of a perfect answer to this question."
      }
      IMPORTANT: "score" MUST be an Integer between 0 and 100.
    `;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());
    
    // Safety coercion
    parsedData.score = Number(String(parsedData.score).replace(/[^0-9]/g, '')) || 0;
    
    return { success: true, data: parsedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateCoverLetter(jobDescription: string, resumeText: string) {

  if (!process.env.GEMINI_API_KEY) return { success: false, error: "Missing API Key" };

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Write a professional, compelling, and modern cover letter for the following job using the provided resume.
      Do not include generic placeholders like [Your Name] if the information is available or can be reasonably omitted. Keep it under 400 words.
      
      Job Description:
      """${jobDescription}"""
      
      Resume:
      """${resumeText}"""
    `;

    const result = await model.generateContent(prompt);
    return { success: true, text: result.response.text() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import * as cheerio from 'cheerio';

export async function autoFillJobFromUrl(url: string) {

  if (!process.env.GEMINI_API_KEY) return { success: false, error: "Missing API Key" };

  let pageTitle = '';
  let content = '';
  let scrapeFailed = false;

  // ── Step 1: Attempt to scrape (may be blocked by LinkedIn/Indeed) ──
  try {
    const scrapedRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000)
    });

    if (scrapedRes.ok) {
      const html = await scrapedRes.text();
      const $ = cheerio.load(html);
      $('script, style, noscript, nav, header, footer').remove();
      pageTitle = $('title').text();
      content = $('body').text().replace(/\s+/g, ' ').substring(0, 15000);
    } else {
      scrapeFailed = true;
    }
  } catch (e) {
    scrapeFailed = true;
  }

  // ── Step 2: Send to Gemini — even with just the URL if scrape failed ──
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = scrapeFailed
      ? `
          You are a job data extraction AI. A user wants to clip a job posting.
          The page content could NOT be scraped (site blocks bots).
          
          However, extract what you CAN from the URL alone using pattern recognition:
          URL: ${url}
          
          LinkedIn URLs often encode the job title and company in the slug like:
          /jobs/view/senior-frontend-engineer-at-google-12345
          
          Indeed URLs often encode the job title in the query params or path.
          
          Return a JSON object with your BEST GUESS at:
          {
            "companyName": "Best guess from URL or 'Unknown'",
            "jobTitle": "Best guess from URL slug",
            "salaryRange": "",
            "location": "On-site"
          }
          Note: If you cannot determine from the URL, leave fields empty — do NOT hallucinate.
        `
      : `
          You are an expert ATS parsing AI. 
          Extract core job details from this webpage content into JSON:
          {
            "companyName": "The hiring company",
            "jobTitle": "The specific job role",
            "salaryRange": "E.g. $130k - $160k (leave empty if none)",
            "location": "Must be exactly 'Remote', 'Hybrid', or 'On-site'"
          }
          Page Title: ${pageTitle}
          Raw Text: """${content}"""
        `;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    if (scrapeFailed) {
      return { 
        success: true, 
        data,
        warning: "Could not load the job page (site blocks automated access). Extracted partial info from the URL. Please verify the fields below."
      };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to auto-fill job URL." };
  }
}

export async function extractPdfText(formData: FormData) {


  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Instead of pdf-parse which requires DOM/Canvas APIs and crashes with "DOMMatrix is not defined",
    // we use pdf2json which is purely Node-native.
    const PDFParser = (await import('pdf2json')).default;
    const pdfParser = new PDFParser(null, true); // true = raw text mode

    const parsedText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });
    
    if (!parsedText) {
      throw new Error("Failed to extract text from PDF. Ensure it is not an image-based PDF.");
    }

    return { success: true, text: parsedText.trim() };
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return { success: false, error: error.message || "Failed to process PDF file." };
  }
}

export async function generateInterviewPrepNotes(params: {
  companyName: string;
  jobTitle: string;
  interviewType: string;
  jobNotes?: string;
  jobUrl?: string;
}) {
  if (!process.env.GEMINI_API_KEY) return { success: false, error: "Missing GEMINI_API_KEY" };

  const { companyName, jobTitle, interviewType, jobNotes, jobUrl } = params;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert career coach helping a B.Tech CSE student prepare for a job interview.

Context:
- Company: ${companyName}
- Role: ${jobTitle}
- Interview Type: ${interviewType}
${jobNotes ? `- Job Description / Notes: ${jobNotes}` : ''}
${jobUrl ? `- Job Posting URL (for context): ${jobUrl}` : ''}

Generate a highly specific, actionable interview preparation guide. Format your response in clean Markdown with these exact sections:

## 🏢 Company Snapshot
3-4 bullet points of key facts about ${companyName} that are relevant to the role. Include their tech stack, culture, or recent milestones if known.

## 🎯 Likely Questions for This Round
List 5 highly targeted questions they are likely to ask in a **${interviewType}** interview for a **${jobTitle}** role. For each question, add a one-line tip on how to answer it well.

## 💡 Your Key Talking Points
3 strategic points you should weave naturally into your answers to make a strong impression (based on the role and company context).

## ❓ Smart Questions to Ask Them
4 thoughtful questions the candidate should ask the interviewer at the end. These should show strategic thinking and genuine curiosity about the role.

Keep the tone confident, direct, and interview-ready. No fluff.
    `.trim();

    const result = await model.generateContent(prompt);
    const markdown = result.response.text();

    return { success: true, prepNotes: markdown };
  } catch (error: any) {
    console.error("AI Prep Generation Error:", error);
    return { success: false, error: error.message || "Failed to generate prep notes." };
  }
}

export type ChatMessage = { role: 'user' | 'model'; text: string };

export async function sendChatMessage(messages: ChatMessage[], systemContext: string) {
  if (!process.env.GEMINI_API_KEY) return { success: false, error: "Missing GEMINI_API_KEY" };

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemContext });

    // Format history for Gemini SDK
    let history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    
    // Gemini Strictly enforces history starting with a 'user' turn
    if (history.length > 0 && history[0].role === 'model') {
       history.shift();
    }
    
    // The last message is the new user prompt
    const latestMessage = messages[messages.length - 1].text;

    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(latestMessage);

    return { success: true, text: result.response.text() };
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return { success: false, error: error.message || "Failed to get AI response." };
  }
}
