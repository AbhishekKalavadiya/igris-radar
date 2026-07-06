import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze content using Gemini AI
 * @param {string} content - Text content to analyze
 * @param {string} type - Type of analysis: 'fingerprint', 'similarity', 'voice'
 */
export async function analyzeContent(content, type = 'fingerprint') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    let prompt = '';
    
    switch (type) {
      case 'fingerprint':
        prompt = `Analyze this content and create a unique fingerprint description that can be used to identify it later. Include key phrases, writing style, and unique characteristics:

Content: ${content}

Respond in JSON format:
{
  "fingerprint": "unique identifier description",
  "keyPhrases": ["phrase1", "phrase2"],
  "style": "description of writing style",
  "uniqueElements": ["element1", "element2"]
}`;
        break;
        
      case 'similarity':
        prompt = `Compare these two pieces of content and determine if they are similar or potentially copied:

Original: ${content.original}
Compared: ${content.compared}

Respond in JSON format:
{
  "similarityScore": 0-100,
  "isLikelyCopy": true/false,
  "matchingElements": ["element1", "element2"],
  "analysis": "detailed analysis"
}`;
        break;
        
      case 'voice':
        prompt = `This is a transcription of an audio sample. Analyze the speaking style, vocabulary, and patterns that could identify this speaker:

Transcription: ${content}

Respond in JSON format:
{
  "voiceprint": "unique voice characteristics",
  "speakingStyle": "description",
  "vocabulary": ["common words/phrases"],
  "patterns": ["pattern1", "pattern2"]
}`;
        break;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { raw: text };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

/**
 * Analyze image content using Gemini Vision
 * @param {string} imageBase64 - Base64 encoded image
 */
export async function analyzeImage(imageBase64, mimeType = 'image/jpeg') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64
        }
      },
      `Analyze this image and create a detailed fingerprint for identification purposes. Include:
1. Main subjects/objects
2. Colors and composition
3. Style (AI-generated, photo, illustration, etc.)
4. Unique identifying features
5. Any text or watermarks visible

Respond in JSON format:
{
  "fingerprint": "unique description",
  "subjects": ["subject1", "subject2"],
  "style": "AI-generated/photo/illustration",
  "colors": ["color1", "color2"],
  "uniqueFeatures": ["feature1", "feature2"],
  "hasWatermark": true/false,
  "textContent": "any visible text"
}`
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { raw: text };
  } catch (error) {
    console.error('Gemini Vision Error:', error);
    throw error;
  }
}
