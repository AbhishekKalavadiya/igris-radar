import { GoogleGenerativeAI } from '@google/generative-ai';
import { getKeys } from '@/lib/systemConfig';

/**
 * Deep Analysis for SEO/AEO/GEO recommendations.
 *
 * API keys come from lib/systemConfig.js - admin-panel keys (stored encrypted
 * in MongoDB) override .env values, so keys added via /admin work immediately.
 *
 * Provider routing: the user's Settings → Audit Preferences "Default AI
 * Provider" is honored when that provider's API key is configured; otherwise
 * we fall back to the first provider with a key (Gemini → OpenAI → Anthropic).
 * Throws only when no provider is configured at all.
 */

async function getAiKeys() {
  const keys = await getKeys(['GEMINI_API_KEY', 'Z_AI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']);
  return {
    gemini: keys.GEMINI_API_KEY,
    zai: keys.Z_AI_API_KEY,
    openai: keys.OPENAI_API_KEY,
    anthropic: keys.ANTHROPIC_API_KEY,
  };
}

/** @returns {Promise<{gemini: boolean, zai: boolean, openai: boolean, anthropic: boolean}>} */
export async function getAvailableAiProviders() {
  const keys = await getAiKeys();
  return { gemini: !!keys.gemini, zai: !!keys.zai, openai: !!keys.openai, anthropic: !!keys.anthropic };
}

/** @returns {Promise<boolean>} whether any Deep Analysis provider is configured */
export async function hasAnyAiProvider() {
  const available = await getAvailableAiProviders();
  return available.gemini || available.zai || available.openai || available.anthropic;
}

/**
 * @param {'gemini'|'zai'|'openai'|'anthropic'} [requested]
 * @param {{gemini: string|null, zai: string|null, openai: string|null, anthropic: string|null}} keys
 * @returns {'gemini'|'zai'|'openai'|'anthropic'}
 */
function resolveProvider(requested, keys) {
  if (requested && keys[requested]) return requested;
  if (requested === 'gemini' && !keys.gemini && keys.zai) return 'zai';
  if (keys.gemini) return 'gemini';
  if (keys.zai) return 'zai';
  if (keys.openai) return 'openai';
  if (keys.anthropic) return 'anthropic';
  throw new Error('No AI provider is configured (add a key in the Admin panel or set GEMINI_API_KEY / Z_AI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY)');
}

// Primary + fallback Gemini models. 'gemini-flash-latest' is Google's rolling alias
// for the current Flash model; the others are concrete fallbacks. Overload (503 "high
// demand") is per-model, so when the primary is saturated a different model usually
// still answers. Pinned legacy versions (e.g. gemini-1.5-flash) get retired and 404.
// Ordered by response DEPTH first (more capable models produce fuller analysis),
// with the faster/terser 'flash-lite' kept as a LAST-resort fallback for reliability
// only — using it earlier noticeably shortens lists like the OWASP mapping.
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-lite-latest'];
const GEMINI_MAX_ATTEMPTS = 2;
// Generous now that AI runs in its own background request (not blocking the scan):
// the free tier can be slow under load, so allow each attempt time to finish.
const GEMINI_ATTEMPT_TIMEOUT_MS = 22000; // per single request
const GEMINI_TOTAL_BUDGET_MS = 48000;    // across all retries/fallbacks

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Rejects if `promise` doesn't settle within `ms`. The underlying request keeps
 * running but is abandoned - critical so a hung provider call can't stall the
 * whole scan request until the serverless function times out.
 */
function withTimeout(promise, ms, label = 'AI request') {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

async function callGemini(prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const deadline = Date.now() + GEMINI_TOTAL_BUDGET_MS;
  let lastErr;

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
      if (Date.now() >= deadline) throw lastErr || new Error('Gemini request timed out');
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const budget = Math.min(GEMINI_ATTEMPT_TIMEOUT_MS, deadline - Date.now());
        const result = await withTimeout(model.generateContent(prompt), budget, 'Gemini request');
        return (await result.response).text();
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || err);
        const overloaded = /\b(503|429|500)\b/.test(msg) || /overload|high demand|unavailable|rate limit|quota|try again|timed out/i.test(msg);
        const modelMissing = /\b404\b/.test(msg) || /not found|not supported|does not exist/i.test(msg);

        // Permanent errors (bad key, 400/401/403) - don't waste retries, fail immediately.
        if (!overloaded && !modelMissing) throw err;
        // Model unavailable on this account - jump straight to the next fallback model.
        if (modelMissing) break;
        // Transient overload/timeout - brief backoff, then retry (if budget remains).
        if (attempt < GEMINI_MAX_ATTEMPTS && Date.now() < deadline) await sleep(500 * attempt);
      }
    }
  }
  throw lastErr;
}

async function callZai(prompt, apiKey) {
  // Z.ai international platform. Do NOT switch to open.bigmodel.cn - that's the
  // separate China BigModel platform with different accounts; a z.ai key 401s there.
  const res = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'glm-4.6',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`Z.ai API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
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
  const run = resolved === 'openai'
    ? callOpenAI(prompt, keys.openai)
    : resolved === 'anthropic'
      ? callAnthropic(prompt, keys.anthropic)
      : resolved === 'zai'
        ? callZai(prompt, keys.zai)
        : callGemini(prompt, keys.gemini);
  // Hard ceiling (above the Gemini internal budget) so a hung provider can't stall
  // the request, while still giving the retry/fallback chain room to complete.
  return withTimeout(run, 52000, 'AI analysis');
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
 * Round-trips a tiny prompt against one provider - used by the admin panel's
 * "Test" button to confirm a saved key actually works.
 * @param {'gemini'|'zai'|'openai'|'anthropic'} provider
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
        : provider === 'zai'
          ? await callZai('Reply with the single word: ok', keys.zai)
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
 * SEO deep analysis, including AI Search Intent Mapping and LSI / keyword-gap
 * analysis, available on the Pro plan.
 *
 * @param {string} html
 * @param {string} url
 * @param {{provider?: string, locale?: string, plan?: string}} [opts]
 */
export async function runDeepSeoAnalysis(html, url, opts = {}) {
  try {
    const plan = opts.plan || 'pro';
    const isPro = plan === 'pro';
    const contentToAnalyze = html.substring(0, 30000);

    let prompt = `Analyze this HTML content for SEO optimization. Target URL: ${url}
${localeContext(opts.locale)}
Content:
${contentToAnalyze}

Respond in JSON format:
{
  "titleSuggestions": ["suggestion 1", "suggestion 2"],
  "metaDescriptionRecommendation": "An optimized meta description...",
  "keywordAnalysis": ["keyword1", "keyword2", "keyword3"],
  "eeatScore": 85,
  "contentGapAnalysis": "Description of what's missing..."`;

    if (isPro) {
      prompt += `,
  "searchIntent": {
    "primaryIntent": "Informational|Transactional|Navigational|Commercial",
    "intentMatchScore": 80,
    "analysis": "How well the page content satisfies what a user searching for the main heading actually wants, and what intent signals are missing."
  },
  "lsiKeywordGaps": ["semantically-related topic 1 the page should cover", "topic 2", "topic 3", "topic 4"],
  "semanticCoverageScore": 70
}

Be thorough - this is a paid, in-depth Pro report. Fill lsiKeywordGaps with genuinely relevant Latent Semantic Indexing topics competitors likely cover, not generic filler.`;
    } else {
      prompt += `
}`;
    }

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
    const plan = opts.plan || 'pro';
    const isPro = plan === 'pro';
    const contentToAnalyze = html.substring(0, 30000);

    let prompt = `Analyze this HTML content for Answer Engine Optimization (AEO) - how well it can be cited by AI engines like ChatGPT, Claude, Perplexity. Target URL: ${url}
${localeContext(opts.locale)}
Content:
${contentToAnalyze}

Respond in JSON format:
{
  "aiCitationLikelihood": "High/Medium/Low",
  "answerFormatSuggestions": ["suggestion 1", "suggestion 2"],
  "questionCoverageGaps": ["missing question 1", "missing question 2"],
  "factualDensityScore": 75,
  "overallRecommendation": "What to do to improve AEO..."`;

    if (isPro) {
      prompt += `,
  "factualDensityAnalysis": "What percentage of the content is verifiable facts, statistics or specific claims vs. filler/opinion, and why that helps or hurts citation likelihood.",
  "answerEngineSimulation": {
    "question": "The single most likely question a user would ask an AI that this page should answer",
    "wouldCite": true,
    "extractedSnippet": "The exact passage you would quote from the page when answering",
    "reasoning": "Why you would or would not cite this page as ChatGPT/Claude/Perplexity"
  },
  "contentFreshness": {
    "score": 70,
    "assessment": "Whether the content appears current based on language, referenced technologies and date markers, flagging anything stale AIs would deprioritize."
  }
}

Be thorough - this is a paid, in-depth Pro report. For questionCoverageGaps, generate 8-10 specific questions a real user would ask an AI about this topic and list ONLY the ones this page does NOT adequately answer. Role-play as an actual answer engine for answerEngineSimulation and be honest about whether you would cite the page.`;
    } else {
      prompt += `
}`;
    }

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

/**
 * @param {Array} findings
 * @param {string} url
 * @param {{provider?: string, locale?: string, plan?: string}} [opts]
 */
export async function runDeepSecurityAnalysis(findings, url, opts = {}) {
  try {
    const plan = opts.plan || 'free';
    const isPro = plan === 'pro';

    // We only send failed findings to save tokens and focus on issues
    const failedFindings = findings.filter(f => !f.passed).map(f => ({
      title: f.title,
      severity: f.severity,
      description: f.description,
      category: f.category
    }));

    const findingsJson = JSON.stringify(failedFindings, null, 2);
    
    let prompt = `Analyze these security vulnerabilities found on ${url}.
Findings:
${findingsJson}

Respond in JSON format:
{
  "executiveSummary": "A 2-3 sentence high-level summary of the overall security posture.",
  "topRisks": ["risk 1", "risk 2"]`;

    if (isPro) {
      prompt += `,
  "remediationCodeSnippets": [
    { "title": "Example Nginx Fix", "code": "server { ... }" }
  ],
  "threatModeling": "A paragraph describing potential attack chains combining these vulnerabilities.",
  "owaspMapping": ["A01:2021-Broken Access Control", "A05:2021-Security Misconfiguration"],
  "complianceReadiness": {
    "gdpr": "High/Medium/Low risk",
    "pci": "High/Medium/Low risk"
  }
}`;
    } else {
      prompt += `,
  "remediationSummary": "A concise 2-sentence summary of the required fixes."
}`;
    }

    return parseJsonObject(await callAI(prompt, opts));
  } catch (error) {
    console.error('AI Security Analysis Error:', error);
    return { error: error.message };
  }
}

// ─── Field-level streaming (NDJSON) ────────────────────────────────────────────
// The model emits ONE JSON object per line: {"field": <name>, "value": <value>}.
// Each complete line is a fully-formed field, so the client can reveal sections as
// they finish without fragile partial-JSON parsing.

function buildSecurityStreamPrompt(findings, url, plan) {
  const isPro = plan === 'pro';
  const failed = (findings || []).filter((f) => !f.passed).map((f) => ({
    title: f.title, severity: f.severity, description: f.description, category: f.category,
  }));
  const findingsJson = JSON.stringify(failed, null, 2);

  const fieldSpecs = [
    `{"field":"executiveSummary","value":"A thorough 3-4 sentence summary of the overall security posture and what it means for the business."}`,
    `{"field":"topRisks","value":["...the 4-7 most serious risks, ranked most-dangerous first..."]}`,
  ];
  if (isPro) {
    fieldSpecs.push(
      `{"field":"threatModeling","value":"A detailed paragraph describing concrete attack chains: how an attacker could combine these specific vulnerabilities step by step into a real breach."}`,
      `{"field":"remediationCodeSnippets","value":[{"title":"...","code":"..."}, "...2-4 concrete, copy-paste snippets (Nginx / .htaccess / next.config etc.) tailored to the findings..."]}`,
      `{"field":"owaspMapping","value":["...EVERY OWASP Top 10 category these findings map to, typically 5-8, each formatted like A05:2021-Security Misconfiguration..."]}`,
      `{"field":"complianceReadiness","value":{"gdpr":"High/Medium/Low risk with a brief reason","pci":"High/Medium/Low risk with a brief reason"}}`,
    );
  } else {
    fieldSpecs.push(`{"field":"remediationSummary","value":"A clear 3-4 sentence summary of the immediate fixes required, in priority order."}`);
  }

  return `You are a senior application security analyst. Analyze these security findings for ${url}.

Findings (failed checks):
${findingsJson}

Respond as NEWLINE-DELIMITED JSON (NDJSON): output EXACTLY one JSON object per line and NOTHING else - no markdown, no code fences, no commentary. Each line MUST have the shape {"field": <name>, "value": <value>} and MUST be on a single physical line (escape any newlines inside string values as \\n).

IMPORTANT: Be thorough and comprehensive - this is a paid, in-depth report. A single line can be long, so NEVER shorten or truncate a list just to keep it compact. Fill every array as completely as the findings justify. In particular, owaspMapping must include EVERY applicable OWASP Top 10 category (usually 5-8, not just the top 2-3).

Emit these fields, in this exact order, with real, specific analysis of the findings above (replace all "..." placeholders with genuine content):
${fieldSpecs.join('\n')}`;
}

/**
 * Streams the model's raw NDJSON text chunk-by-chunk. Gemini streams natively; other
 * providers fall back to emitting the whole response once. Includes per-model fallback
 * and an idle timeout so a stalled stream can't hang.
 * @param {string} prompt
 * @returns {AsyncGenerator<string>}
 */
async function* streamProviderText(prompt) {
  const keys = await getAiKeys();
  const resolved = resolveProvider(undefined, keys);

  if (resolved !== 'gemini') {
    const text = resolved === 'openai' ? await callOpenAI(prompt, keys.openai) 
               : resolved === 'zai' ? await callZai(prompt, keys.zai) 
               : await callAnthropic(prompt, keys.anthropic);
    yield text;
    return;
  }

  const genAI = new GoogleGenerativeAI(keys.gemini);
  let lastErr;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(model.generateContentStream(prompt), 15000, 'Gemini stream start');
      const iterator = result.stream[Symbol.asyncIterator]();
      while (true) {
        const next = await withTimeout(iterator.next(), 20000, 'Gemini stream');
        if (next.done) break;
        const t = typeof next.value?.text === 'function' ? next.value.text() : '';
        if (t) yield t;
      }
      return; // completed successfully
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      const transient = /\b(503|429|500)\b/.test(msg) || /overload|high demand|unavailable|rate limit|quota|timed out/i.test(msg);
      const modelMissing = /\b404\b/.test(msg) || /not found|not supported|does not exist/i.test(msg);
      if (!transient && !modelMissing) throw err; // permanent (bad key) - stop
      // else fall through to the next fallback model
    }
  }
  throw lastErr || new Error('Gemini streaming failed');
}

/**
 * Streams the security analysis as NDJSON text chunks.
 * @param {{findings: Array, url: string, plan?: string}} opts
 * @returns {AsyncGenerator<string>}
 */
export async function* streamSecurityAnalysis({ findings, url, plan }) {
  const prompt = buildSecurityStreamPrompt(findings, url, plan);
  yield* streamProviderText(prompt);
}

/**
 * Assembles the final analysis object from accumulated NDJSON text (used to persist
 * the completed result). Skips any malformed lines.
 * @param {string} text
 */
export function assembleNdjson(text) {
  const ai = {};
  if (!text) return ai;
  for (let line of text.split('\n')) {
    line = line.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    if (!line || line[0] !== '{') continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    if (obj && typeof obj.field === 'string' && obj.field !== '__error__') ai[obj.field] = obj.value;
  }
  return ai;
}
