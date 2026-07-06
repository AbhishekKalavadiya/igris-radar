import { getKey } from '@/lib/systemConfig';

/**
 * Queries a specific LLM provider with a given prompt.
 * API keys resolve through lib/systemConfig.js (admin panel overrides .env).
 *
 * @param {'openai'|'anthropic'|'perplexity'|'gemini'} provider
 * @param {string} prompt
 * @returns {Promise<string>} The LLM's response
 */
export async function queryLLM(provider, prompt) {
  try {
    switch (provider) {
      case 'openai': {
        const key = await getKey('OPENAI_API_KEY');
        if (!key) throw new Error('OpenAI API Key not configured');
        return await queryOpenAI(prompt, key);
      }
      case 'anthropic': {
        const key = await getKey('ANTHROPIC_API_KEY');
        if (!key) throw new Error('Anthropic API Key not configured');
        return await queryAnthropic(prompt, key);
      }
      case 'perplexity': {
        const key = await getKey('PERPLEXITY_API_KEY');
        if (!key) throw new Error('Perplexity API Key not configured');
        return await queryPerplexity(prompt, key);
      }
      case 'gemini':
        return await queryGemini(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error querying ${provider}:`, error);
    return `[Error querying ${provider}: ${error.message}]`;
  }
}

async function queryOpenAI(prompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    })
  });
  
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function queryAnthropic(prompt, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    })
  });
  
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const data = await res.json();
  return data.content[0].text;
}

async function queryPerplexity(prompt, apiKey) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3-sonar-large-32k-online',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    })
  });
  
  if (!res.ok) throw new Error(`Perplexity HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function queryGemini(prompt) {
  const { generateGeminiText } = await import('@/lib/scanners/shared/aiAnalyzer');
  return generateGeminiText(prompt);
}

/**
 * Checks if a brand name or URL is mentioned in the response text.
 * 
 * @param {string} responseText 
 * @param {string} brandName 
 * @param {string} url 
 * @returns {boolean}
 */
export function checkBrandMention(responseText, brandName, url) {
  if (!responseText) return false;
  
  const text = responseText.toLowerCase();
  const brand = brandName.toLowerCase();
  
  // Extract domain from url (e.g. https://www.example.com -> example.com)
  let domain = url.toLowerCase();
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace('www.', '');
  } catch (e) {}
  
  return text.includes(brand) || text.includes(domain);
}

/**
 * Analyzes the sentiment of a brand mention using Gemini (if available).
 * 
 * @param {string} responseText 
 * @param {string} brandName 
 * @returns {Promise<'positive'|'neutral'|'negative'|'unknown'>}
 */
export async function analyzeMentionSentiment(responseText, brandName) {
  try {
    const { generateGeminiText } = await import('@/lib/scanners/shared/aiAnalyzer');

    const prompt = `Analyze the sentiment of how the brand "${brandName}" is mentioned in the following text.
Respond with exactly one word: "positive", "neutral", or "negative".

Text:
"${responseText}"`;

    const sentiment = (await generateGeminiText(prompt)).trim().toLowerCase();

    if (['positive', 'neutral', 'negative'].includes(sentiment)) {
      return sentiment;
    }
    return 'neutral';
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    return 'unknown';
  }
}
