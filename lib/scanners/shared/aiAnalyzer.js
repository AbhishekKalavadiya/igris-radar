import { GoogleGenerativeAI } from '@google/generative-ai';
import { getKeys } from '@/lib/systemConfig';

/**
 * Deep Analysis for SEO/AEO/GEO recommendations.
 *
 * API keys come from lib/systemConfig.js — admin-panel keys (stored encrypted
 * in MongoDB) override .env values, so keys added via /admin work immediately.
 *
 * Provider routing: the user's Settings → Audit Preferences "Default AI
 * Provider" is honored when that provider's API key is configured; otherwise
 * we fall back to the first provider with a key (Gemini → OpenAI → Anthropic).
 * Throws only when no provider is configured at all.
 */

async function getAiKeys() {
  const keys = await getKeys(['GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']);
  return {
    gemini: keys.GEMINI_API_KEY,
    openai: keys.OPENAI_API_KEY,
    anthropic: keys.ANTHROPIC_API_KEY,
  };
}

/** @returns {Promise<{gemini: boolean, openai: boolean, anthropic: boolean}>} */
export async function getAvailableAiProviders() {
  const keys = await getAiKeys();
  return { gemini: !!keys.gemini, openai: !!keys.openai, anthropic: !!keys.anthropic };
}

/** @returns {Promise<boolean>} whether any Deep Analysis provider is configured */
export async function hasAnyAiProvider() {
  const available = await getAvailableAiProviders();
  return available.gemini || available.openai || available.anthropic;
}

/**
 * @param {'gemini'|'openai'|'anthropic'} [requested]
 * @param {{gemini: string|null, openai: string|null, anthropic: string|null}} keys
 * @returns {'gemini'|'openai'|'anthropic'}
 */
function resolveProvider(requested, keys) {
  if (requested && keys[requested]) return requested;
  if (keys.gemini) return 'gemini';
  if (keys.openai) return 'openai';
  if (keys.anthropic) return 'anthropic';
  throw new Error('No AI provider is configured (add a key in the Admin panel or set GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY)');
}

async function callGemini(prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // 'gemini-flash-latest' is Google's rolling alias for the current Flash
  // model — pinned versions (e.g. gemini-1.5-flash) get retired and 404.
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function callOpenAI(prompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt, apiKey) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

/**
 * Runs the prompt against the resolved provider and returns raw text.
 * @param {string} prompt
 * @param {{provider?: string}} [opts]
 */
async function callAI(prompt, { provider } = {}) {
  const keys = await getAiKeys();
  const resolved = resolveProvider(provider, keys);
  if (resolved === 'openai') return callOpenAI(prompt, keys.openai);
  if (resolved === 'anthropic') return callAnthropic(prompt, keys.anthropic);
  return callGemini(prompt, keys.gemini);
}

/**
 * Plain-text Gemini generation for other modules (lib/scanners/shared/llmTracker.js).
 * Throws when no Gemini key is configured.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateGeminiText(prompt) {
  const keys = await getAiKeys();
  if (!keys.gemini) throw new Error('GEMINI_API_KEY is not configured');
  return callGemini(prompt, keys.gemini);
}

/**
 * Round-trips a tiny prompt against one provider — used by the admin panel's
 * "Test" button to confirm a saved key actually works.
 * @param {'gemini'|'openai'|'anthropic'} provider
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function testAiProvider(provider) {
  try {
    const keys = await getAiKeys();
    if (!keys[provider]) return { ok: false, error: 'No API key configured for this provider' };
    const reply = provider === 'openai'
      ? await callOpenAI('Reply with the single word: ok', keys.openai)
      : provider === 'anthropic'
        ? await callAnthropic('Reply with the single word: ok', keys.anthropic)
        : await callGemini('Reply with the single word: ok', keys.gemini);
    return reply ? { ok: true } : { ok: false, error: 'Provider returned an empty response' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

const LOCALE_LABELS = {
  us: 'the United States',
  uk: 'the United Kingdom',
  eu: 'the European Union',
};

/** Adds a locale directive to a prompt when the audit targets a region. */
function localeContext(locale) {
  if (!locale || locale === 'global') return '';
  return `\nTarget audience region: ${LOCALE_LABELS[locale] || locale}. Tailor keyword, spelling, and content recommendations to this region.\n`;
}

function parseJsonObject(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return { error: 'Failed to parse JSON response' };
}

function parseJsonArray(text) {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return { error: 'Failed to parse JSON response' };
}

/**
 * @param {string} html
 * @param {string} url
 * @param {{provider?: string, locale?: string}} [opts]
 */
export async function runDeepSeoAnalysis(html, url, opts = {}) {
  try {
    const contentToAnalyze = html.substring(0, 30000);

    const prompt = `Analyze this HTML content for SEO optimization. Target URL: ${url}
${localeContext(opts.locale)}
Content:
${contentToAnalyze}

Respond in JSON format:
{
  "titleSuggestions": ["suggestion 1", "suggestion 2"],
  "metaDescriptionRecommendation": "An optimized meta description...",
  "keywordAnalysis": ["keyword1", "keyword2", "keyword3"],
  "eeatScore": 85,
  "contentGapAnalysis": "Description of what's missing..."
}`;

    return parseJsonObject(await callAI(prompt, opts));
  } catch (error) {
    console.error('AI SEO Analysis Error:', error);
    return { error: error.message };
  }
}

/**
 * @param {string} html
 * @param {string} url
 * @param {{provider?: string, locale?: string}} [opts]
 */
export async function runDeepAeoAnalysis(html, url, opts = {}) {
  try {
    const contentToAnalyze = html.substring(0, 30000);

    const prompt = `Analyze this HTML content for Answer Engine Optimization (AEO) - how well it can be cited by AI engines like ChatGPT, Claude, Perplexity. Target URL: ${url}
${localeContext(opts.locale)}
Content:
${contentToAnalyze}

Respond in JSON format:
{
  "aiCitationLikelihood": "High/Medium/Low",
  "answerFormatSuggestions": ["suggestion 1", "suggestion 2"],
  "questionCoverageGaps": ["missing question 1", "missing question 2"],
  "factualDensityScore": 75,
  "overallRecommendation": "What to do to improve AEO..."
}`;

    return parseJsonObject(await callAI(prompt, opts));
  } catch (error) {
    console.error('AI AEO Analysis Error:', error);
    return { error: error.message };
  }
}

/**
 * @param {string} html
 * @param {string} url
 * @param {{provider?: string, locale?: string}} [opts]
 */
export async function runDeepGeoAnalysis(html, url, opts = {}) {
  try {
    const contentToAnalyze = html.substring(0, 30000);

    const prompt = `Analyze this HTML content for Generative Engine Optimization (GEO) - how likely are LLMs to trust, cite, and recommend this entity and content. Target URL: ${url}
${localeContext(opts.locale)}
Content:
${contentToAnalyze}

Respond in JSON format:
{
  "entityConfidence": "High/Medium/Low",
  "citationSimulation": "Would you cite this source? Yes/No, because...",
  "topicalAuthorityScore": 85,
  "uniquenessScore": 70,
  "recommendations": ["suggestion 1", "suggestion 2"]
}`;

    return parseJsonObject(await callAI(prompt, opts));
  } catch (error) {
    console.error('AI GEO Analysis Error:', error);
    return { error: error.message };
  }
}

/**
 * @param {string} html
 * @param {string} url
 * @param {string} topic
 * @param {{provider?: string, locale?: string}} [opts]
 */
export async function runPromptCoverageAnalysis(html, url, topic, opts = {}) {
  try {
    const contentToAnalyze = html.substring(0, 30000);

    const prompt = `Based on the following content for URL ${url} about the topic "${topic}", generate 5 common questions/prompts a user might ask an AI about this topic. Then, evaluate how well the content answers each prompt.
${localeContext(opts.locale)}
Content:
${contentToAnalyze}

Respond in JSON format as an array of objects:
[
  {
    "prompt": "User's question...",
    "coverage": "covered|partial|missing",
    "reason": "Brief explanation"
  }
]`;

    return parseJsonArray(await callAI(prompt, opts));
  } catch (error) {
    console.error('AI Prompt Coverage Error:', error);
    return { error: error.message };
  }
}
