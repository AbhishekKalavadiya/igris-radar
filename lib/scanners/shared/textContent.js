/**
 * lib/scanners/shared/textContent.js
 * Shared prose-text extraction and readability helpers for the SEO, AEO, and
 * GEO scanners, all of which need word counts and/or Flesch readability
 * scores from the same rendered page.
 */

/**
 * Returns the page's visible prose text, with non-prose DOM nodes (scripts —
 * including JSON-LD structured data, which every audited page ships several
 * blocks of — plus <style>/<noscript>) stripped first. cheerio's raw
 * `.text()` walks every text node including <script> contents; counting
 * JSON-LD as body copy inflates word counts and, because dense JSON has
 * almost no sentence punctuation, catastrophically skews words-per-sentence
 * ratios for any readability formula.
 *
 * @param {cheerio.Root} $
 * @returns {string} cleaned, whitespace-collapsed text
 */
export function extractCleanText($) {
  const $content = $.root().clone();
  $content.find('script, style, noscript').remove();
  return $content.text().replace(/\s+/g, ' ').trim();
}

/**
 * Approximate syllable count via vowel-group heuristic. Standard technique
 * for lightweight Flesch scoring — far more accurate than a character-length
 * proxy, though still an approximation (no dictionary lookup).
 * @param {string} word
 * @returns {number}
 */
export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const matches = w.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) count -= 1;
  return Math.max(count, 1);
}

/**
 * Flesch Reading Ease score for a block of clean prose text (see
 * extractCleanText). Higher is easier to read; 60-70 is "plain English".
 * @param {string} text
 * @returns {number}
 */
export function fleschReadingEase(text) {
  const wordList = text.split(/\s+/).filter(Boolean);
  const words = wordList.length || 1;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length || 1;
  const syllables = wordList.reduce((sum, w) => sum + countSyllables(w), 0);
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}
