import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { calculateScore } from './shared/scoring.js';
import { fetchRobotsTxt, isUserAgentAllowed } from './shared/robotsParser.js';
import { extractSchemas } from './shared/schemaExtractor.js';

export async function runAeoScan(url) {
  const { addFinding, getFindings } = createFindingsCollector();

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
    
    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
    const origin = targetUrl.origin;

    // --- CRAWLABILITY ---
    
    const robotsTxt = await fetchRobotsTxt(origin) || '';
    
    const gptAllowed = isUserAgentAllowed(robotsTxt, 'GPTBot');
    addFinding(
      'Crawlability', 'critical', 'OpenAI GPTBot Access',
      'Checks if GPTBot is allowed in robots.txt.',
      gptAllowed,
      'Remove Disallow rules for GPTBot in robots.txt.',
      'Allow GPTBot in robots.txt'
    );

    const claudeAllowed = isUserAgentAllowed(robotsTxt, 'ClaudeBot');
    addFinding(
      'Crawlability', 'critical', 'Anthropic ClaudeBot Access',
      'Checks if ClaudeBot is allowed in robots.txt.',
      claudeAllowed,
      'Remove Disallow rules for ClaudeBot in robots.txt.',
      'Allow ClaudeBot in robots.txt'
    );

    const perplexityAllowed = isUserAgentAllowed(robotsTxt, 'PerplexityBot');
    addFinding(
      'Crawlability', 'critical', 'PerplexityBot Access',
      'Checks if PerplexityBot is allowed in robots.txt.',
      perplexityAllowed,
      'Remove Disallow rules for PerplexityBot in robots.txt.',
      'Allow PerplexityBot in robots.txt'
    );

    const googleOtherAllowed = isUserAgentAllowed(robotsTxt, 'Google-Extended');
    addFinding(
      'Crawlability', 'high', 'Google-Extended Access',
      'Checks if Google-Extended (Google AI) is allowed.',
      googleOtherAllowed,
      'Remove Disallow rules for Google-Extended in robots.txt.',
      'Allow Google-Extended in robots.txt'
    );

    const hasCrawlDelay = robotsTxt.toLowerCase().includes('crawl-delay');
    addFinding(
      'Crawlability', 'medium', 'Crawl Delay Limits',
      'Checks if crawl-delay is set, which may throttle AI indexing.',
      !hasCrawlDelay,
      'Remove or lower crawl-delay for AI bots if you want faster indexing.',
      ''
    );

    let hasLlmsTxt = false;
    let hasAiTxt = false;
    try {
      const [llmsRes, aiRes] = await Promise.allSettled([
        fetch(new URL('/llms.txt', origin), { method: 'HEAD', signal: AbortSignal.timeout(3000) }),
        fetch(new URL('/ai.txt', origin), { method: 'HEAD', signal: AbortSignal.timeout(3000) })
      ]);
      hasLlmsTxt = llmsRes.status === 'fulfilled' && llmsRes.value.ok;
      hasAiTxt = aiRes.status === 'fulfilled' && aiRes.value.ok;
    } catch (e) {}

    addFinding(
      'Crawlability', 'medium', 'AI.txt / LLMs.txt Presence',
      'Checks for standard AI instruction files (/llms.txt or /ai.txt).',
      hasLlmsTxt || hasAiTxt,
      'Create an llms.txt or ai.txt file at your domain root.',
      'Create a standard llms.txt file describing my site for AI bots.'
    );


    // --- CONTENT STRUCTURE ---

    const hasQuestions = $('h2, h3').filter((_, el) => $(el).text().trim().endsWith('?')).length > 0;
    addFinding(
      'Content Structure', 'high', 'Q&A Formatting',
      'Evaluates if content uses Question/Answer headers.',
      hasQuestions,
      'Format subheadings as questions that users ask AI engines.',
      'Rewrite these subheadings as questions.'
    );

    // Direct answer paragraph check: paragraph immediately following a heading
    let hasDirectAnswers = false;
    $('h2, h3').each((_, el) => {
      const nextP = $(el).next('p');
      if (nextP.length > 0 && nextP.text().trim().split(' ').length < 50) {
        hasDirectAnswers = true;
      }
    });
    addFinding(
      'Content Structure', 'high', 'Direct Answer Paragraphs',
      'Checks for concise (under 50 words) paragraphs immediately following headings.',
      hasDirectAnswers,
      'Provide a short, direct answer immediately after a question heading before expanding.',
      'Write a 40-word direct answer for this heading.'
    );

    const hasLists = $('ul').length > 0 || $('ol').length > 0;
    addFinding(
      'Content Structure', 'medium', 'Structured Lists',
      'Checks for bulleted or numbered lists, which AIs prefer for extraction.',
      hasLists,
      'Break complex paragraphs into bullet points.',
      'Convert this paragraph into a bulleted list.'
    );

    const schemaData = extractSchemas($);
    const hasFaq = schemaData.hasType('FAQPage') || schemaData.hasType('HowTo') || schemaData.hasType('Article');
    addFinding(
      'Content Structure', 'high', 'Rich Schema.org Data',
      'Looks for FAQPage, HowTo, or Article schema.',
      hasFaq,
      'Implement FAQ or HowTo schema to feed structured data to AI engines.',
      'Generate FAQPage schema for these 3 questions.'
    );

    const hasTables = $('table thead').length > 0;
    addFinding(
      'Content Structure', 'medium', 'Data Tables',
      'Checks for well-structured tables with headers.',
      hasTables,
      'Use HTML tables for comparative or tabular data; AIs parse them well.',
      ''
    );

    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;
    addFinding(
      'Content Structure', 'low', 'Content Depth',
      `Word count: ${wordCount}. Deep content is cited more often.`,
      wordCount > 600,
      'Expand the content to cover the topic more comprehensively.',
      ''
    );


    // --- CITATION-READINESS ---

    const hasAuthor = $('meta[name="author"]').length > 0 || $('[rel="author"]').length > 0;
    const hasDate = $('meta[property="article:published_time"]').length > 0 || $('time').length > 0;
    addFinding(
      'Citation-Readiness', 'high', 'Author & Freshness',
      'Verifies author tags and publication dates.',
      hasAuthor && hasDate,
      'Add author meta tags and <time> elements with publish dates.',
      'Add author and publish date meta tags in Next.js.'
    );

    const canonical = $('link[rel="canonical"]').attr('href');
    addFinding(
      'Citation-Readiness', 'medium', 'Canonical Source Attribution',
      'Checks if the page asserts itself as the canonical source.',
      !!canonical,
      'Add a canonical link so AI attributes the content to this URL.',
      ''
    );

    let hasAuthorBio = textContent.toLowerCase().includes('about the author') || schemaData.hasType('Person');
    addFinding(
      'Citation-Readiness', 'low', 'Expert Credentials',
      'Checks for author bio or Person schema.',
      hasAuthorBio,
      'Add an author bio section or Person schema to build E-E-A-T.',
      'Generate Person schema for an author profile.'
    );

    // Look for external authority links
    let hasAuthorityLinks = false;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('.edu') || href.includes('.gov') || href.includes('wikipedia.org'))) {
        hasAuthorityLinks = true;
      }
    });
    addFinding(
      'Citation-Readiness', 'medium', 'Source Citations',
      'Checks for outbound links to high-authority domains (.edu, .gov).',
      hasAuthorityLinks,
      'Cite authoritative sources to increase trustworthiness.',
      ''
    );

  } catch (error) {
    console.error('[AEO Scanner] Error:', error);
    addFinding('General', 'critical', 'Site Fetch', `Failed to load URL: ${error.message}`, false, 'Ensure the site is accessible.', '');
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    score: overall,
    categories,
    findings: getFindings(),
    timestamp: new Date().toISOString()
  };
}
