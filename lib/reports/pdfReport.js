/**
 * lib/reports/pdfReport.js
 * Server-side PDF report generation for scan exports (Export Report button).
 * Renders with @react-pdf/renderer - pure JS, no headless Chrome dependency.
 *
 * Branding: every export shows Igris Radar branding by default. Agency/
 * Enterprise users (or whatever Admin → Plans grants `whiteLabel` to) can
 * replace the header/footer with their own company name, logo and footer
 * text via Settings → Branding (see lib/branding.js resolveReportBranding).
 */

import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { readFileSync } from 'fs';
import { join } from 'path';

// Default Igris Radar mark for the PDF's white page background (dark icon on
// white, matching Logo_Dark.png). Loaded lazily and fault-tolerantly: on some
// serverless hosts (e.g. Vercel) the `public/` folder isn't on the function's
// filesystem, so a read may fail - in that case the PDF simply renders without
// the default logo rather than crashing the export. Cached after first success.
let DEFAULT_LOGO;
function getDefaultLogo() {
  if (DEFAULT_LOGO !== undefined) return DEFAULT_LOGO;
  try {
    DEFAULT_LOGO = readFileSync(join(process.cwd(), 'public', 'logo-dark.png'));
  } catch {
    DEFAULT_LOGO = null;
  }
  return DEFAULT_LOGO;
}

// Static hex palette for the PDF only - react-pdf renders outside the DOM,
// so Tailwind classes and CSS custom properties don't apply here (same
// exception CLAUDE.md carves out for SVG/canvas contexts).
const TEAL = '#3bbcdc';
const TEAL_MID = '#2a9db5';
const INK = '#0f172a';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const SURFACE = '#f8fafc';
const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#2563eb',
  passed: '#16a34a',
};

const SCAN_TYPE_LABELS = {
  security: 'Security Scan',
  seo: 'SEO Audit',
  aeo: 'AEO Audit',
  geo: 'GEO Audit',
  performance: 'Site Health',
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: INK },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, objectFit: 'contain' },
  brandName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: TEAL },
  generatedAt: { fontSize: 8, color: MUTED },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: MUTED, marginBottom: 20 },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: SURFACE, borderRadius: 8, padding: 16, marginBottom: 20 },
  scoreNumber: { fontSize: 36, fontFamily: 'Helvetica-Bold' },
  scoreLabel: { fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 16 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BORDER },
  categoryName: { textTransform: 'capitalize' },
  categoryScore: { fontFamily: 'Helvetica-Bold' },
  finding: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 10, marginBottom: 8 },
  findingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  findingTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', flex: 1, paddingRight: 8 },
  severityBadge: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, textTransform: 'uppercase' },
  findingDesc: { fontSize: 9, color: MUTED, marginBottom: 4, lineHeight: 1.4 },
  findingRemediation: { fontSize: 9, color: INK, backgroundColor: SURFACE, padding: 6, borderRadius: 4, lineHeight: 1.4 },
  remediationLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: TEAL_MID, textTransform: 'uppercase', marginBottom: 2 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: MUTED },
});

function scoreColor(score) {
  if (score >= 70) return TEAL;
  if (score >= 40) return TEAL_MID;
  return SEVERITY_COLORS.critical;
}

function scoreRating(score) {
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Fair';
  return 'At Risk';
}

function Header({ branding }) {
  const hasCustomLogo = !!branding.logoDataUri;
  const showDefaultLogo = !hasCustomLogo && !branding.hideDefaultBranding;
  const displayName = branding.companyName || (branding.hideDefaultBranding ? '' : 'Igris Radar');
  const logoSrc = hasCustomLogo ? branding.logoDataUri : (showDefaultLogo ? getDefaultLogo() : null);

  return (
    <View style={styles.headerRow}>
      <View style={styles.brandRow}>
        {!!logoSrc && <Image src={logoSrc} style={styles.logo} />}
        {!!displayName && <Text style={styles.brandName}>{displayName}</Text>}
      </View>
      <Text style={styles.generatedAt}>Generated {new Date().toLocaleString('en-GB')}</Text>
    </View>
  );
}

function ScoreBox({ score }) {
  return (
    <View style={styles.scoreBox}>
      <Text style={{ ...styles.scoreNumber, color: scoreColor(score) }}>{score}</Text>
      <View>
        <Text style={styles.scoreLabel}>Overall Score</Text>
        <Text style={{ color: scoreColor(score), fontFamily: 'Helvetica-Bold', fontSize: 12 }}>{scoreRating(score)}</Text>
      </View>
    </View>
  );
}

function CategoryBreakdown({ categories }) {
  if (!categories || Object.keys(categories).length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {Object.entries(categories).map(([name, value]) => {
        const catScore = typeof value === 'number' ? value : value?.score ?? 0;
        return (
          <View key={name} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{name.replace(/([A-Z])/g, ' $1').trim()}</Text>
            <Text style={{ ...styles.categoryScore, color: scoreColor(catScore) }}>{catScore}/100</Text>
          </View>
        );
      })}
    </View>
  );
}

function Findings({ findings }) {
  if (!findings || findings.length === 0) return null;
  // Failed findings first, matching the dashboard's default sort
  const sorted = [...findings].sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1));

  return (
    <View>
      <Text style={styles.sectionTitle}>Findings ({findings.filter(f => !f.passed).length} issues, {findings.filter(f => f.passed).length} passed)</Text>
      {sorted.map((f) => {
        const color = f.passed ? SEVERITY_COLORS.passed : (SEVERITY_COLORS[f.severity] || MUTED);
        return (
          <View key={f.id} style={styles.finding} wrap={false}>
            <View style={styles.findingHeader}>
              <Text style={styles.findingTitle}>{f.title}</Text>
              <Text style={{ ...styles.severityBadge, backgroundColor: color }}>{f.passed ? 'Passed' : f.severity}</Text>
            </View>
            {!!f.description && <Text style={styles.findingDesc}>{f.description}</Text>}
            {!f.passed && !!f.remediation && (
              <View style={styles.findingRemediation}>
                <Text style={styles.remediationLabel}>Remediation</Text>
                <Text>{f.remediation}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Footer({ branding }) {
  const defaultLine = branding.hideDefaultBranding ? '' : 'Powered by Igris Radar';
  const line = branding.footerText || defaultLine;
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{line}</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

/**
 * @param {Object} opts
 * @param {Object} opts.scan - a persisted scan document (SeoScanDoc/AeoScanDoc/GeoScanDoc/SecurityScanDoc shape)
 * @param {'security'|'seo'|'aeo'|'geo'} opts.scanType
 * @param {import('@/lib/branding').DEFAULT_BRANDING} opts.branding
 * @returns {Promise<Buffer>}
 */
export async function renderScanReportPdf({ scan, scanType, branding }) {
  const typeLabel = SCAN_TYPE_LABELS[scanType] || 'Audit Report';

  const doc = (
    <Document title={`${typeLabel} - ${scan.url}`}>
      <Page size="A4" style={styles.page}>
        <Header branding={branding} />
        <Text style={styles.title}>{typeLabel} Report</Text>
        <Text style={styles.subtitle}>{scan.url}</Text>

        <ScoreBox score={scan.score} />
        <CategoryBreakdown categories={scan.categories} />
        <Findings findings={scan.findings} />

        <Footer branding={branding} />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
