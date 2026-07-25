/**
 * Pure parse + sanitize for AI-generated fix artifacts. No external imports so it
 * runs under `node --test` with zero config. Used by fixGenerator.js.
 *
 * The AI is fed attacker-controlled text (finding descriptions scraped from the
 * scanned site), so its output is treated as untrusted: only the 5 known string
 * fields survive, language is allowlisted, and every field is size-capped.
 */

export const LANGUAGE_ALLOWLIST = ['html', 'json', 'nginx', 'apache', 'javascript', 'typescript', 'css', 'bash', 'sh', 'yaml', 'toml', 'sql', 'python', 'text', 'markdown'];

const REQUIRED_FIELDS = ['summary', 'fixContent', 'language', 'whereToApply', 'verifyStep'];
const FIX_CONTENT_MAX = 20 * 1024; // 20 KB
const SMALL_FIELD_MAX = 2 * 1024;  //  2 KB

/** Pulls the first {...} block out of a possibly fenced/prose-wrapped string. */
function extractJsonObject(text) {
  const str = String(text || '').trim();
  const cleaned = str.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Could not generate a valid fix, please retry');
  }
  const jsonSub = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonSub);
  } catch {
    throw new Error('Could not generate a valid fix, please retry');
  }
}

/**
 * @param {string} rawText - raw AI response
 * @returns {{summary:string, fixContent:string, language:string, whereToApply:string, verifyStep:string}}
 * @throws if the response is malformed, missing/non-string fields, or oversized
 */
export function parseAndValidateFix(rawText) {
  const obj = extractJsonObject(rawText);

  for (const field of REQUIRED_FIELDS) {
    if (typeof obj[field] !== 'string') {
      throw new Error('Could not generate a valid fix, please retry');
    }
  }

  if (Buffer.byteLength(obj.fixContent, 'utf8') > FIX_CONTENT_MAX) {
    throw new Error('Generated fix is too large');
  }
  for (const field of ['summary', 'language', 'whereToApply', 'verifyStep']) {
    if (Buffer.byteLength(obj[field], 'utf8') > SMALL_FIELD_MAX) {
      throw new Error('Generated fix is too large');
    }
  }

  const language = LANGUAGE_ALLOWLIST.includes(obj.language) ? obj.language : 'text';

  // Rebuild from scratch so no unexpected keys survive.
  return {
    summary: obj.summary,
    fixContent: obj.fixContent,
    language,
    whereToApply: obj.whereToApply,
    verifyStep: obj.verifyStep,
  };
}
