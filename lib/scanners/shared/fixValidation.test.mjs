import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAndValidateFix, LANGUAGE_ALLOWLIST } from './fixValidation.mjs';

test('parses a well-formed response into the 5-field fix', () => {
  const raw = JSON.stringify({
    summary: 'Adds the missing meta description.',
    fixContent: '<meta name="description" content="...">',
    language: 'html',
    whereToApply: 'Inside <head> of your homepage.',
    verifyStep: 'Re-run the SEO scan.',
  });
  const fix = parseAndValidateFix(raw);
  assert.equal(fix.language, 'html');
  assert.equal(fix.summary, 'Adds the missing meta description.');
  assert.deepEqual(Object.keys(fix).sort(), ['fixContent', 'language', 'summary', 'verifyStep', 'whereToApply']);
});

test('extracts JSON even when wrapped in markdown fences / prose', () => {
  const raw = 'Here you go:\n```json\n{"summary":"s","fixContent":"c","language":"text","whereToApply":"w","verifyStep":"v"}\n```';
  const fix = parseAndValidateFix(raw);
  assert.equal(fix.summary, 's');
});

test('clamps an unknown language to "text"', () => {
  const raw = JSON.stringify({ summary: 's', fixContent: 'c', language: 'brainfuck', whereToApply: 'w', verifyStep: 'v' });
  assert.equal(parseAndValidateFix(raw).language, 'text');
});

test('every allowlisted language passes through unchanged', () => {
  for (const lang of LANGUAGE_ALLOWLIST) {
    const raw = JSON.stringify({ summary: 's', fixContent: 'c', language: lang, whereToApply: 'w', verifyStep: 'v' });
    assert.equal(parseAndValidateFix(raw).language, lang);
  }
});

test('throws on malformed JSON', () => {
  assert.throws(() => parseAndValidateFix('not json at all'), /valid fix/i);
});

test('throws when a required field is missing', () => {
  const raw = JSON.stringify({ summary: 's', fixContent: 'c', language: 'text', whereToApply: 'w' }); // no verifyStep
  assert.throws(() => parseAndValidateFix(raw), /valid fix/i);
});

test('throws when a required field is not a string', () => {
  const raw = JSON.stringify({ summary: 's', fixContent: 123, language: 'text', whereToApply: 'w', verifyStep: 'v' });
  assert.throws(() => parseAndValidateFix(raw), /valid fix/i);
});

test('throws when fixContent exceeds 20KB', () => {
  const raw = JSON.stringify({ summary: 's', fixContent: 'x'.repeat(20 * 1024 + 1), language: 'text', whereToApply: 'w', verifyStep: 'v' });
  assert.throws(() => parseAndValidateFix(raw), /too large/i);
});

test('throws when a small field exceeds 2KB', () => {
  const raw = JSON.stringify({ summary: 'x'.repeat(2 * 1024 + 1), fixContent: 'c', language: 'text', whereToApply: 'w', verifyStep: 'v' });
  assert.throws(() => parseAndValidateFix(raw), /too large/i);
});

test('strips unexpected extra fields', () => {
  const raw = JSON.stringify({ summary: 's', fixContent: 'c', language: 'text', whereToApply: 'w', verifyStep: 'v', evil: 'x' });
  const fix = parseAndValidateFix(raw);
  assert.equal(fix.evil, undefined);
});
