'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Copy, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { SEVERITY_STYLES } from '@/lib/scannerAccents';

const FALLBACK_DETAILS = {
  'HTTPS Enforced': "HTTPS encrypts the communication between your user's browser and your server, protecting sensitive data from man-in-the-middle attacks and packet sniffing.",
  'Content-Security-Policy': "A Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks. It works by restricting the domains that the browser should consider to be valid sources of executable scripts.",
  'X-Frame-Options': "The X-Frame-Options HTTP response header can be used to indicate whether or not a browser should be allowed to render a page in a <frame>, <iframe>, <embed> or <object>. Sites can use this to avoid clickjacking attacks, by ensuring that their content is not embedded into other sites.",
  'Strict-Transport-Security': "HTTP Strict Transport Security (HSTS) is a web security policy mechanism that helps to protect websites against man-in-the-middle attacks such as protocol downgrade attacks and cookie hijacking. It allows web servers to declare that web browsers should automatically interact with it using only HTTPS.",
  'Server Info Disclosure': "Exposing server version details (e.g., \"nginx/1.20.1\" or \"X-Powered-By: Express\") allows attackers to quickly look up known vulnerabilities for your specific software stack, significantly reducing the time needed to breach your systems.",
  'Web Application Firewall (WAF)': "A Web Application Firewall (WAF) filters, monitors, and blocks HTTP traffic to and from a web application. It protects against attacks such as cross-site forgery, cross-site-scripting (XSS), file inclusion, and SQL injection.",
  'Secure Cookies': "The Secure attribute ensures the cookie is only sent over encrypted (HTTPS) requests. The HttpOnly attribute restricts access to the cookie from client-side scripts, preventing XSS attacks from stealing session tokens.",
  'CORS Misconfiguration': "Cross-Origin Resource Sharing (CORS) is a mechanism that allows restricted resources on a web page to be requested from another domain. A wildcard or overly permissive CORS policy allows malicious sites to read your authenticated data.",
  'Exposed API Keys': "Hardcoded API keys inside client-side bundles (like HTML or JS files) can be easily scraped by anyone. Attackers can use these keys to impersonate your application, bypass billing limits, or access sensitive external services, leading to significant financial or data loss.",
  'Outdated Frontend Libraries': "Using outdated JavaScript libraries with known vulnerabilities (CVEs) exposes your users to XSS or other client-side attacks. Attackers frequently scan for known outdated library signatures to exploit well-documented flaws.",
  'SPF Record': "Sender Policy Framework (SPF) is an email authentication method designed to detect forging sender addresses during the delivery of the email. It helps prevent spammers from sending messages on behalf of your domain, protecting your brand reputation.",
  'DMARC Record': "Domain-based Message Authentication, Reporting, and Conformance (DMARC) uses SPF and DKIM to provide instructions to the receiving mail server on what to do if an email fails authentication. It acts as a strict policy layer against email spoofing.",
  'Exposed Sensitive Files': "Web servers sometimes misconfigure directory permissions, inadvertently exposing configuration files (.env), version control histories (.git), or backup files. These files often contain database passwords, secret keys, and source code which can lead to a full system compromise.",
  'Site Fetch': "The scanner was unable to reach the provided URL. Ensure the domain resolves correctly and the server is actively accepting connections.",
  // SEO Findings
  'robots.txt configuration': "The robots.txt file gives instructions about their site to web robots; this is called The Robots Exclusion Protocol. It tells search engines which pages they can and cannot crawl.",
  'XML Sitemap presence': "An XML sitemap lists a website's important pages, making sure search engines can find and crawl them all, thus aiding in faster indexing.",
  'Canonical URL': "A canonical URL is the URL of the page that search engines think is most representative from a set of duplicate pages on your site. This resolves duplicate content issues.",
  'Hreflang Tags': "Hreflang tags tell search engines which language you are using on a specific page, so the search engine can serve that result to users searching in that language.",
  'Meta Robots Indexability': "The meta robots tag controls how search engines crawl and index a page. A 'noindex' directive explicitly blocks the page from appearing in search results.",
  'URL Structure': "Clean, semantic URLs (using hyphens instead of underscores) are easier for both users and search engines to read, improving click-through rates and relevance signals.",
  'Response Time (TTFB)': "Time to First Byte (TTFB) is a foundational metric for measuring connection setup time and web server responsiveness. Faster response times improve user experience and crawl budgets.",
  'Mobile Friendliness': "With mobile-first indexing, Google predominantly uses the mobile version of the content for indexing and ranking. The viewport tag is critical for responsive design.",
  'Title Tag Optimization': "Title tags are a major ranking factor. They should accurately and concisely describe a page's content. Too short and you lack keywords; too long and it gets truncated.",
  'Meta Description': "Meta descriptions provide a summary of a webpage. While not a direct ranking factor, they heavily influence click-through rates (CTR) from the search engine results page.",
  'Duplicate Title/Description': "Using the same text for both the title and meta description represents a missed opportunity to provide additional context and keywords to users and search engines.",
  'H1 Tag Hierarchy': "The H1 tag should act as the main headline for a page. Having exactly one H1 tag helps search engines understand the primary topic of the content.",
  'Title Keyword in H1': "Matching the primary keywords in your Title tag with your H1 tag reinforces the page's core topic to search engines, establishing strong relevance.",
  'Image Alt Text': "Alt text describes the appearance and function of an image. It is vital for web accessibility and helps search engines understand the image content for image search rankings.",
  'Thin Content': "Search engines prioritize comprehensive, in-depth content. Pages with very low word counts may be considered 'thin' and struggle to rank for competitive terms.",
  'Content Readability': "Content that is easier to read provides a better user experience, which leads to lower bounce rates and higher engagement metrics. These are indirect signals for SEO.",
  'Schema.org JSON-LD': "Schema markup is code that helps search engines provide more informative results for users (Rich Snippets). JSON-LD is Google's recommended format for this data.",
  'Open Graph Tags': "Open Graph tags control how URLs are displayed when shared on social media (like Facebook or LinkedIn), improving visibility and click-through rates on those platforms.",
  'Twitter Card Tags': "Twitter Card tags ensure your content looks great when shared on X (formerly Twitter), providing a rich media experience that drives more traffic.",
  'Schema Types Inventory': "Identifies the specific structured data types present on the page, ensuring you are targeting the appropriate Rich Results.",
  'Internal Link Count': "Internal links connect your content and give Google an idea of the structure of your website. They help establish a hierarchy and spread link equity around your site.",
  'Nofollow on Internal Links': "Using 'nofollow' on internal links stops link equity (PageRank) from flowing through your site. You should generally follow all internal links.",
  'Missing/Generic Anchor Text': "Anchor text provides context about the destination page. Generic text like 'click here' wastes an opportunity to pass keyword relevance to the linked page.",
  'External Link Protocols': "Linking out to insecure (HTTP) sites can provide a poor experience for your users and slightly diminish the trust signals of your own site.",
  'Broken Internal Links': "Broken links create dead ends for users and search engine crawlers. They harm user experience and waste your site's crawl budget.",
  // AEO Findings
  'OpenAI GPTBot Access': "GPTBot is OpenAI's web crawler. Allowing it ensures your content can be ingested and potentially cited in ChatGPT responses.",
  'Anthropic ClaudeBot Access': "ClaudeBot is Anthropic's crawler. Allowing it ensures your site's information is available to Claude models for accurate responses and citations.",
  'PerplexityBot Access': "Perplexity relies heavily on real-time web scraping to provide cited answers. Allowing PerplexityBot is crucial for visibility in their AI search engine.",
  'Google-Extended Access': "Google-Extended controls access for Google's generative AI models (like Gemini) separately from standard Googlebot search indexing.",
  'Crawl Delay Limits': "Strict crawl delays in robots.txt can prevent aggressive AI crawlers from fetching your content in a timely manner, reducing your footprint in their training data.",
  'AI.txt / LLMs.txt Presence': "An llms.txt file is an emerging standard that provides AI models with a streamlined, markdown-based representation of your site's content and rules.",
  'Q&A Formatting': "AI engines often look for direct question-and-answer pairs when formulating responses to user queries. Subheadings phrased as questions match common user prompts.",
  'Direct Answer Paragraphs': "AIs often extract the first short paragraph immediately following a heading to use as a featured snippet or direct answer. Keeping it concise and definitive improves extraction chances.",
  'Structured Lists': "Language models easily parse bulleted and numbered lists. Structuring complex information this way makes it more likely an AI will reproduce your points accurately.",
  'Rich Schema.org Data': "FAQPage and HowTo schemas provide explicitly structured Q&A data that AI engines can ingest directly without needing to parse complex HTML layouts.",
  'Data Tables': "LLMs are highly capable of understanding markdown and HTML tables. Presenting data in tables makes it accessible for AIs to perform comparisons and synthesize data.",
  'Content Depth': "AI models prefer comprehensive sources when generating long-form answers. In-depth content provides more entities and relationships for the model to learn.",
  'Author & Freshness': "AI engines prioritize up-to-date information authored by identifiable entities to maintain response quality and reduce hallucinations.",
  'Canonical Source Attribution': "A canonical tag helps AI crawlers understand the original source of information, ensuring your domain gets the citation rather than a syndicator or scraper.",
  'Expert Credentials': "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) applies to AEO. Clear author bios and Person schema help AI establish the credibility of the information.",
  'Source Citations': "Outbound links to highly authoritative domains (like .gov or .edu) signal to AI models that your content is well-researched and factually grounded.",
  // GEO Findings
  'Author Byline and Bio': "Explicit author signals (like rel='author' or Person schema) establish the human expertise behind the content, which generative engines heavily rely on for trust.",
  'Social / sameAs Links': "Linking to your verified social profiles and Wikipedia via sameAs schema helps generative engines build a complete Knowledge Graph entity for your brand.",
  'Brand Logo Detection': "Explicitly defining your logo in HTML or Schema ensures that when generative engines cite your brand, they can display your official branding accurately.",
  'Publication Dates': "Clear publication and modification dates provide strong freshness signals. AI models prefer citing recently updated content for time-sensitive queries.",
  'About Page Linked': "An easily accessible 'About' or 'Team' page is a core trust signal. It helps establish the organization's legitimacy and real-world presence.",
  'Content Depth (Word Count)': "Generative engines favor comprehensive, deep content that thoroughly covers a topic and its subtopics, as it provides more context for their models.",
  'Breadcrumb Trails': "Breadcrumbs (both visible and in schema) help LLMs understand the hierarchical structure of your content and how topics relate to each other.",
  'FAQ Schema / Section': "FAQ sections directly mirror the Question/Answer format of generative AI prompts, making your content highly likely to be extracted as a direct answer.",
  'Internal Link Density': "Dense internal linking creates topical clusters. When generative engines crawl these clusters, they associate your domain with deep topical authority.",
  'Subtopic Hierarchy (H2/H3)': "Breaking content down with detailed H2 and H3 tags provides a clear outline that AI engines use to rapidly parse and extract specific information.",
  'External Citations': "AI engines trust content that cites sources. Linking out to external references acts as a bibliography, proving your content is researched.",
  'Data Point Density': "High density of specific data points (numbers, stats, years) makes your content more factual and citable, which LLMs prioritize when answering factual queries.",
  'Quotes and Citations': "Using proper HTML citation tags (blockquote, cite) structures external opinions in a way that AI models can easily attribute and extract.",
  'Authoritative Source Links': "Citing highly trusted domains (.edu, .gov, academic sites) passes a 'trust by association' signal to generative engines.",
  'Paragraph Chunking': "LLMs prefer to extract short, self-contained paragraphs (2-4 sentences). Long, rambling paragraphs are harder for the model to isolate and cite cleanly.",
  'Data Structuring (Tables)': "LLMs excel at parsing tabular data. Converting comparisons or lists into HTML tables makes the data highly accessible for synthesis by AI.",
  'List Usage': "Bulleted and numbered lists break down complex steps or features into easily digestible chunks that language models frequently reproduce in their outputs.",
  'Pronoun Ambiguity': "Replacing ambiguous pronouns (e.g., 'This is...') with explicit nouns ensures that if an AI extracts a single sentence, the context is preserved."
};

export default function AuditFindingCard({ finding }) {
  const [copiedId, setCopiedId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-severity-critical" />;
      case 'high': return <AlertCircle className="h-5 w-5 text-severity-high" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-severity-medium" />;
      case 'low': return <Info className="h-5 w-5 text-severity-low" />;
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-success" />;
      default: return <Info className="h-5 w-5 text-severity-low" />;
    }
  };

  const getSeverityColorClass = (severity, passed) => {
    if (passed || severity === 'passed') return SEVERITY_STYLES.passed.bar;
    return (SEVERITY_STYLES[severity] || SEVERITY_STYLES.low).bar;
  };

  const isPassed = finding.passed || finding.severity === 'passed';
  const displayDetails = finding.details || FALLBACK_DETAILS[finding.title];

  return (
    <Card className={`glass-card premium-hover overflow-hidden ${isPassed ? 'opacity-75 bg-card/30' : ''}`}>
      <div className={`h-1 w-full ${getSeverityColorClass(finding.severity, isPassed)}`} />
      <CardContent className="p-0">
        <div className="p-5 flex items-start gap-4">
          <div className="mt-1">
            {getSeverityIcon(finding.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div 
              className={`flex items-center gap-2 mb-1 flex-wrap ${displayDetails ? 'cursor-pointer' : ''}`}
              onClick={() => displayDetails && setIsExpanded(!isExpanded)}
            >
              <h4 className={`font-medium ${isPassed ? 'text-muted-foreground' : 'text-foreground'}`}>{finding.title}</h4>
              <Badge variant="outline" className="text-[10px] py-0">{finding.category}</Badge>
              {displayDetails && (
                <div className="ml-auto flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {isExpanded ? 'Hide Details' : 'Why this matters'}
                  {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{finding.description}</p>
            
            {isExpanded && displayDetails && (
              <div className="bg-muted/30 border border-border rounded-md p-4 mb-4 text-sm text-foreground/90 animate-in fade-in slide-in-from-top-2">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> In-Depth Explanation
                </div>
                <p className="leading-relaxed">{displayDetails}</p>
              </div>
            )}
            
            {!isPassed && (
              <div className="space-y-4">
                {finding.remediation && (
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">Remediation:</span> {finding.remediation}
                  </div>
                )}
                
                {finding.aiFixPrompt && (
                  <div className="bg-muted/50 rounded-lg border border-border p-4 relative group overflow-hidden">
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Agent-Native Fix Prompt
                    </div>
                    <code className="text-sm text-foreground/80 block pr-10 break-words whitespace-pre-wrap">
                      {finding.aiFixPrompt}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => copyToClipboard(finding.aiFixPrompt, finding.id)}
                      title="Copy Prompt"
                    >
                      {copiedId === finding.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
