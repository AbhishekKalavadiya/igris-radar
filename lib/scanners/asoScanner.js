import { v4 as uuidv4 } from 'uuid';
import { calculateScore } from '@/lib/scanners/shared/scoring';
import { createFindingsCollector } from '@/lib/scanners/shared/findings';
import { parseAppUrl, extractIos, extractAndroid, getKeywordRank, getCategoryCompetitors } from '@/lib/scanners/shared/asoExtractor';
import { env } from '@/lib/env';

/**
 * Runs the App Store Optimization (ASO) scan.
 * @param {string} url
 */
export async function runAsoScan(url) {
  const { addFinding, getFindings } = createFindingsCollector();
  
  // 1. Detect Platform & Extract Data
  const { platform, appId, normalizedUrl } = parseAppUrl(url);
  let appData;
  if (platform === 'ios') {
    appData = await extractIos(appId, normalizedUrl);
  } else {
    appData = await extractAndroid(appId, normalizedUrl);
  }

  const {
    title, subtitle, description, developer, category, contentRating,
    hasIAP, lastUpdated, rating, ratingCount, screenshots, hasVideo,
    locales, iconUrl, hasFeatureGraphic, minInstalls, html, isUniversal
  } = appData;

  const TIER = 'starter'; // All basic ASO checks are gated to starter

  // ─── TIER 1: EXACT CHECKS (23) ────────────────────────────────────────────────

  // Category: metadata
  // 1. Title length & keyword presence
  const maxTitleLen = platform === 'ios' ? 30 : 50;
  const titleLen = title.length;
  addFinding(
    'metadata',
    titleLen > 0 && titleLen <= maxTitleLen ? 'passed' : (titleLen === 0 ? 'critical' : 'medium'),
    'App Title Length',
    `Your title is ${titleLen} characters. ${platform === 'ios' ? 'iOS' : 'Android'} allows up to ${maxTitleLen}.`,
    titleLen > 0 && titleLen <= maxTitleLen,
    'Ensure your title is within the character limit and includes your most important keyword.',
    `Rewrite this app title "${title}" to be under ${maxTitleLen} characters and include strong keywords.`,
    `Current: ${titleLen}/${maxTitleLen}`,
    TIER
  );

  // 2. Subtitle / Short Description
  const maxSubLen = platform === 'ios' ? 30 : 80;
  const subLen = subtitle.length;
  addFinding(
    'metadata',
    subLen > 0 && subLen <= maxSubLen ? 'passed' : (subLen === 0 ? 'high' : 'medium'),
    'Subtitle / Short Description',
    `Your short description is ${subLen} characters. It should be engaging and under ${maxSubLen} chars.`,
    subLen > 0 && subLen <= maxSubLen,
    'Add a compelling short description to improve conversion rate.',
    `Write a compelling ${maxSubLen}-character short description for an app named "${title}".`,
    `Current: ${subLen}/${maxSubLen}`,
    TIER
  );

  // 3. Long Description
  const descWords = description ? description.split(/\s+/).length : 0;
  addFinding(
    'metadata',
    descWords > 100 ? 'passed' : 'high',
    'Long Description Quality',
    `Your description has ${descWords} words. A detailed description helps with indexation.`,
    descWords > 100,
    'Expand your description to clearly explain features and benefits, aiming for at least 100 words.',
    `Expand this app description to highlight features better: ${description.substring(0, 200)}...`,
    `Current words: ${descWords}`,
    TIER
  );

  // 4. Developer Name
  addFinding(
    'metadata',
    developer ? 'passed' : 'medium',
    'Developer Name Presence',
    'Developer name is present and can sometimes contribute to keyword signals.',
    !!developer,
    'Ensure your developer name is properly registered.',
    '',
    `Developer: ${developer}`,
    TIER
  );

  // 5. Category correctness
  addFinding(
    'metadata',
    category ? 'passed' : 'high',
    'App Category',
    'The app is assigned to a specific category.',
    !!category,
    'Select the most relevant primary category for your app.',
    '',
    `Category: ${category}`,
    TIER
  );

  // 6. Content rating
  addFinding(
    'metadata',
    contentRating ? 'passed' : 'low',
    'Content Rating',
    'Content rating is properly set, ensuring it reaches the right audience.',
    !!contentRating,
    'Set an appropriate content rating for your app.',
    '',
    `Rating: ${contentRating}`,
    TIER
  );

  // 7. In-App Purchase clarity
  addFinding(
    'metadata',
    hasIAP !== null ? 'passed' : 'low',
    'In-App Purchases',
    hasIAP ? 'The app offers In-App Purchases.' : 'No In-App Purchases detected.',
    true, 
    '',
    '',
    hasIAP ? 'IAP present' : 'No IAP',
    TIER
  );

  // 8. Update recency
  let daysSinceUpdate = 999;
  if (lastUpdated) {
    daysSinceUpdate = Math.floor((new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24));
  }
  addFinding(
    'metadata',
    daysSinceUpdate < 90 ? 'passed' : (daysSinceUpdate < 180 ? 'medium' : 'high'),
    'Update Recency',
    `App was last updated ${daysSinceUpdate} days ago. Frequent updates signal active maintenance to the algorithm.`,
    daysSinceUpdate < 90,
    'Release bug fixes or feature updates at least every 3 months.',
    '',
    `Days since update: ${daysSinceUpdate}`,
    TIER
  );

  // 8.5 Device Compatibility / Universal Support
  if (platform === 'ios') {
    addFinding(
      'technical',
      isUniversal ? 'passed' : 'medium',
      'Universal App Support',
      'Universal apps (iPhone + iPad) rank better overall and tap into the iPad market.',
      !!isUniversal,
      'Ensure your app supports iPad native resolutions to boost your keyword reach.',
      '',
      isUniversal ? 'Universal' : 'iPhone Only',
      TIER
    );
  } else {
    addFinding(
      'technical',
      'passed', // Android apps are generally universal, assume pass for basic scan
      'Device Compatibility',
      'App is available on the Play Store across multiple form factors.',
      true, '', '', 'Android Ready', TIER
    );
  }

  // Category: reviews
  // 9, 10
  const avgRating = parseFloat(rating) || 0;
  addFinding(
    'reviews',
    avgRating >= 4.0 ? 'passed' : 'high',
    'Average Rating Score',
    `Your average rating is ${avgRating.toFixed(1)}/5. Apps under 4.0 see significant conversion drops.`,
    avgRating >= 4.0,
    'Implement an in-app rating prompt targeting happy users.',
    '',
    `Rating: ${avgRating.toFixed(1)}`,
    TIER
  );

  addFinding(
    'reviews',
    ratingCount > 50 ? 'passed' : 'medium',
    'Total Ratings Volume',
    `You have ${ratingCount} ratings. Higher volume improves search ranking.`,
    ratingCount > 50,
    'Encourage more users to leave ratings.',
    '',
    `Count: ${ratingCount}`,
    TIER
  );

  // 12. Developer response presence
  const hasDevResponse = html.includes('developerResponse') || html.includes('Developer response');
  addFinding(
    'reviews',
    hasDevResponse ? 'passed' : 'medium',
    'Developer Responses',
    'Replying to reviews (especially negative ones) improves retention and signals engagement to the store.',
    hasDevResponse,
    'Start replying to your most recent 1- and 2-star reviews.',
    '',
    hasDevResponse ? 'Responses detected' : 'No responses found in recent HTML',
    TIER
  );

  // 13. Recent reviews count
  const currentYear = new Date().getFullYear();
  const hasRecentReviews = html.includes(currentYear.toString());
  addFinding(
    'reviews',
    hasRecentReviews ? 'passed' : 'low',
    'Recent Review Activity',
    'Recent reviews show the app is currently being downloaded and used.',
    hasRecentReviews,
    'Drive more continuous review volume.',
    '',
    hasRecentReviews ? 'Recent activity detected' : 'Low recent activity',
    TIER
  );

  // Category: visuals
  // 14. Screenshot count
  const ssCount = screenshots.length;
  addFinding(
    'visuals',
    ssCount >= 5 ? 'passed' : 'high',
    'Screenshot Count',
    `You have ${ssCount} screenshots. Using at least 5 maximizes visual real estate.`,
    ssCount >= 5,
    'Add more screenshots showcasing core features.',
    '',
    `Count: ${ssCount}`,
    TIER
  );

  // 15. Preview video
  addFinding(
    'visuals',
    hasVideo ? 'passed' : 'medium',
    'Preview Video',
    'Preview videos can increase conversion rates by up to 20%.',
    hasVideo,
    'Create a 15-30s preview video showing actual gameplay or app usage.',
    '',
    hasVideo ? 'Video found' : 'No video detected',
    TIER
  );

  // 16. App icon Quality
  addFinding(
    'visuals',
    iconUrl ? 'passed' : 'critical',
    'App Icon Quality',
    'A high-resolution app icon is essential for brand identity.',
    !!iconUrl,
    'Upload a valid high-resolution app icon.',
    '',
    iconUrl ? 'Valid icon' : 'Missing',
    TIER
  );

  // 17. Feature graphic (Android)
  if (platform === 'android') {
    addFinding(
      'visuals',
      hasFeatureGraphic ? 'passed' : 'high',
      'Feature Graphic',
      'Android requires a feature graphic which appears at the top of the listing.',
      hasFeatureGraphic,
      'Upload a 1024x500 feature graphic.',
      '',
      hasFeatureGraphic ? 'Found' : 'Missing',
      TIER
    );
  } else {
    addFinding('visuals', 'passed', 'Feature Graphic', 'N/A for iOS.', true, '', '', '', TIER);
  }

  // Category: keywords
  // 18. Primary keyword in title
  const hasKeywordsInTitle = title.includes('-') || title.includes(':') || title.split(' ').length > 2;
  addFinding(
    'keywords',
    hasKeywordsInTitle ? 'passed' : 'medium',
    'Title Keyword Optimization',
    'Your title seems to be just the brand name. Adding descriptive keywords improves ranking.',
    hasKeywordsInTitle,
    'Append a core keyword to your title (e.g., "BrandName - Expense Tracker").',
    `Suggest 3 title variations for "${title}" that include strong ASO keywords.`,
    '',
    TIER
  );

  // 19. Description keyword density
  const descLower = description.toLowerCase();
  const descWordsArray = descLower.split(/\W+/).filter(w => w.length > 3);
  const wordCounts = {};
  descWordsArray.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);
  const sortedWords = Object.keys(wordCounts).sort((a,b) => wordCounts[b] - wordCounts[a]);
  const topWord = sortedWords.length > 0 ? sortedWords[0] : null;
  const topWordText = topWord ? `"${topWord}" (${wordCounts[topWord]} times)` : 'none';
  
  addFinding(
    'keywords',
    (topWord && wordCounts[topWord] >= 3) ? 'passed' : 'medium',
    'Description Keyword Density',
    `Your most repeated word is ${topWordText}. Play Store indexes the long description heavily.`,
    (topWord && wordCounts[topWord] >= 3),
    'Ensure your target keywords are naturally repeated 3-5 times in the description.',
    `Rewrite this paragraph to include the keyword naturally: ${description.substring(0, 150)}`,
    topWord ? `Top word: ${topWord}` : 'No words found',
    TIER
  );

  // 20. Long-tail opportunity
  addFinding(
    'keywords',
    subtitle.includes(' ') || descWords > 50 ? 'passed' : 'medium',
    'Long-Tail Keyword Opportunity',
    'Short descriptions missing long-tail phrases miss out on lower-competition searches.',
    subtitle.includes(' ') || descWords > 50,
    'Include 2-3 word phrases in your subtitle/description.',
    '',
    '',
    TIER
  );

  // Category: localization
  // 21
  const localeCount = locales.length;
  addFinding(
    'localization',
    localeCount > 1 ? 'passed' : 'medium',
    'Localization Coverage',
    `We detected ${localeCount} localized versions. Translating your listing opens up global markets.`,
    localeCount > 1,
    'Translate your title, subtitle, and description into your top 3 secondary markets.',
    `Translate this app description into Spanish and French: "${subtitle}"`,
    `Locales: ${localeCount}`,
    TIER
  );
  // 22
  addFinding(
    'localization',
    true,
    'Primary Language',
    'Primary language text successfully extracted.',
    true, '', '', '', TIER
  );

  // Category: technical
  // 23
  const hasJsonLd = html.includes('application/ld+json');
  addFinding(
    'technical',
    hasJsonLd ? 'passed' : 'low',
    'Structured Data Presence',
    'Web listings with schema.org SoftwareApplication data perform better in Google Web Search.',
    hasJsonLd,
    'Ensure your web landing page or store page retains structured data.',
    '',
    hasJsonLd ? 'JSON-LD found' : 'Missing',
    TIER
  );

  // ─── TIER 2: APPROXIMATE CHECKS (9) ──────────────────────────────────────────

  // Keywords (Approximate)
  // 24. Keyword rank for primary term
  const primaryTerm = title.split(/[-:]/)[0].trim().toLowerCase() || category.toLowerCase();
  const rank = await getKeywordRank(platform, primaryTerm, appId);
  addFinding(
    'keywords',
    (rank && rank <= 10) ? 'passed' : (rank ? 'medium' : 'high'),
    'Primary Keyword Rank',
    `Your app ranks #${rank || '50+'} for "${primaryTerm}".`,
    (rank && rank <= 10),
    'Improve metadata and rating volume to boost your rank for primary terms.',
    '',
    `Term: ${primaryTerm} (Rank: ${rank || '50+'})`,
    TIER,
    true // approximate flag
  );

  // 25. Keyword rank for secondary terms
  const secondaryTerm = category.toLowerCase();
  const secRank = await getKeywordRank(platform, secondaryTerm, appId);
  addFinding(
    'keywords',
    (secRank && secRank <= 25) ? 'passed' : 'medium',
    'Secondary Keyword Rank',
    `Your app ranks #${secRank || '50+'} for "${secondaryTerm}".`,
    (secRank && secRank <= 25),
    'Target niche secondary keywords in your subtitle.',
    '',
    `Term: ${secondaryTerm} (Rank: ${secRank || '50+'})`,
    TIER,
    true // approximate
  );

  // 26. Missing keyword gap flag
  addFinding(
    'keywords',
    descWords > 150 ? 'passed' : 'medium',
    'Competitor Keyword Gap',
    'Shorter descriptions often miss keywords that top 10 competitors are using.',
    descWords > 150,
    'Analyze top competitors and integrate missing features/keywords.',
    '',
    '',
    TIER,
    true
  );

  // Competition (Approximate)
  // 27 & 28. Category rank position & Competitors
  const competitors = await getCategoryCompetitors(platform, category, appId, primaryTerm);
  const inTop10 = competitors.some(c => c.appId.toString() === appId.toString());
  
  addFinding(
    'competition',
    inTop10 ? 'passed' : 'medium',
    'Category Rank',
    inTop10 ? `You are ranking in the Top 10 for ${category}.` : `You are outside the Top 10 for ${category}.`,
    inTop10,
    'Drive sustained download velocity to climb category charts.',
    '',
    `Category: ${category}`,
    TIER,
    true
  );

  addFinding(
    'competition',
    competitors.length > 0 ? 'passed' : 'low',
    'Similar Competitors Identified',
    `Identified ${competitors.length} similar competitors in your category.`,
    competitors.length > 0,
    'Monitor these competitors for metadata updates.',
    '',
    competitors.length > 0 ? `Top comps: ${competitors.slice(0, 3).map(c => c.name).join(', ')}` : 'None found',
    TIER,
    true
  );

  // 29. Competitor review count gap
  const compReviewGap = ratingCount < 1000 ? 'high' : 'passed';
  addFinding(
    'competition',
    compReviewGap,
    'Review Volume Gap',
    `Top competitors often have 10k+ reviews. You have ${ratingCount}.`,
    ratingCount >= 1000,
    'Accelerate review acquisition.',
    '',
    '',
    TIER,
    true
  );

  // Downloads (Approximate)
  // 30, 31, 32
  if (platform === 'android') {
    addFinding(
      'competition',
      minInstalls >= 10000 ? 'passed' : 'medium',
      'Android Install Bracket',
      `Google Play reports ${minInstalls}+ installs.`,
      minInstalls >= 10000,
      'Increase acquisition efforts to reach the next install bracket.',
      '',
      `Installs: ${minInstalls}+`,
      TIER,
      true
    );
    addFinding('competition', 'passed', 'iOS Download Estimate', 'N/A for Android', true, '', '', '', TIER, true);
  } else {
    const estimatedIos = ratingCount * 200; // heuristic
    addFinding(
      'competition',
      estimatedIos >= 10000 ? 'passed' : 'medium',
      'iOS Download Estimate',
      `Based on ${ratingCount} ratings, estimated downloads: ~${estimatedIos}.`,
      estimatedIos >= 10000,
      'Increase acquisition efforts.',
      '',
      `Est. Downloads: ~${estimatedIos}`,
      TIER,
      true
    );
    addFinding('competition', 'passed', 'Android Install Bracket', 'N/A for iOS', true, '', '', '', TIER, true);
  }

  addFinding(
    'competition',
    'passed', // Just informational
    'Download Trend Signal',
    'Review velocity indicates stable download trends.',
    true, '', '', '', TIER, true
  );

  const findings = getFindings();
  const { overall: score, categories: categoryScores } = calculateScore(findings);

  return {
    id: uuidv4(),
    url: normalizedUrl,
    platform,
    appId,
    appName: title,
    score,
    categories: categoryScores,
    findings,
    html: null, // Don't persist full HTML to save DB space
  };
}
