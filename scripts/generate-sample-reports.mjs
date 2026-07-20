/**
 * Generates the 5 landing-page sample PDF reports (fake data, marketing use
 * only) into public/sample-reports/. Mirrors the layout/palette of
 * lib/reports/pdfReport.js (the real export), plus a locked/redacted finding
 * treatment standing in for the dashboard's blur-and-upgrade pattern.
 *
 * Run with: node scripts/generate-sample-reports.mjs
 * (Plain Node script - no JSX, since this runs outside the Next.js/SWC pipeline.)
 */
import { createElement as h } from 'react';
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ALL_REPORTS } from './sample-report-data.mjs';

const TEAL = '#3bbcdc';
const TEAL_MID = '#2a9db5';
const INK = '#0f172a';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const SURFACE = '#f8fafc';
const REDACT = '#cbd5e1';
const REDACT_LIGHT = '#e2e8f0';
const SEVERITY_COLORS = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#2563eb', passed: '#16a34a' };
const TIER_LABELS = { starter: 'Starter', pro: 'Pro', agency: 'Agency' };

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: INK },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 12 },
  brandName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: TEAL },
  generatedAt: { fontSize: 8, color: MUTED },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: MUTED, marginBottom: 4 },
  sampleTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEAL_MID, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
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
  lockedCategory: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  tierBadge: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff', backgroundColor: MUTED, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, textTransform: 'uppercase' },
  redactBar: { height: 9, borderRadius: 3, backgroundColor: REDACT, marginBottom: 6 },
  redactBarShort: { height: 7, borderRadius: 3, backgroundColor: REDACT_LIGHT },
  unlockLine: { fontSize: 8.5, color: TEAL_MID, fontFamily: 'Helvetica-Bold', marginTop: 8 },
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

function Header() {
  return h(View, { style: styles.headerRow },
    h(Text, { style: styles.brandName }, 'Igris Radar'),
    h(Text, { style: styles.generatedAt }, `Generated ${new Date().toLocaleDateString('en-GB')}`)
  );
}

function ScoreBox({ score }) {
  return h(View, { style: styles.scoreBox },
    h(Text, { style: { ...styles.scoreNumber, color: scoreColor(score) } }, String(score)),
    h(View, null,
      h(Text, { style: styles.scoreLabel }, 'Overall Score'),
      h(Text, { style: { color: scoreColor(score), fontFamily: 'Helvetica-Bold', fontSize: 12 } }, scoreRating(score))
    )
  );
}

function CategoryBreakdown({ categories }) {
  return h(View, null,
    h(Text, { style: styles.sectionTitle }, 'Category Breakdown'),
    ...Object.entries(categories).map(([name, catScore]) =>
      h(View, { key: name, style: styles.categoryRow },
        h(Text, { style: styles.categoryName }, name),
        h(Text, { style: { ...styles.categoryScore, color: scoreColor(catScore) } }, `${catScore}/100`)
      )
    )
  );
}

function UnlockedFinding({ f }) {
  const color = f.passed ? SEVERITY_COLORS.passed : (SEVERITY_COLORS[f.severity] || MUTED);
  return h(View, { style: styles.finding, wrap: false },
    h(View, { style: styles.findingHeader },
      h(Text, { style: styles.findingTitle }, f.title),
      h(Text, { style: { ...styles.severityBadge, backgroundColor: color } }, f.passed ? 'Passed' : f.severity)
    ),
    f.description ? h(Text, { style: styles.findingDesc }, f.description) : null,
    (!f.passed && f.remediation) ? h(View, { style: styles.findingRemediation },
      h(Text, { style: styles.remediationLabel }, 'Remediation'),
      h(Text, null, f.remediation)
    ) : null
  );
}

// Stands in for the dashboard's blur treatment: category + severity stay
// visible (so the report still reads as substantive), but title/description
// are redacted bars rather than real text - no finding name is leaked.
function LockedFinding({ f }) {
  const color = SEVERITY_COLORS[f.severity] || MUTED;
  return h(View, { style: styles.finding, wrap: false },
    h(View, { style: styles.findingHeader },
      h(Text, { style: styles.lockedCategory }, f.category),
      h(View, { style: { flexDirection: 'row', gap: 4 } },
        h(Text, { style: { ...styles.severityBadge, backgroundColor: color } }, f.severity),
        h(Text, { style: styles.tierBadge }, TIER_LABELS[f.tier])
      )
    ),
    h(View, { style: { ...styles.redactBar, width: '78%' } }),
    h(View, { style: { ...styles.redactBarShort, width: '55%' } }),
    h(Text, { style: styles.unlockLine }, `Log in or upgrade to ${TIER_LABELS[f.tier]} to view this finding`)
  );
}

function Findings({ findings }) {
  const failedCount = findings.filter(f => !f.locked && !f.passed).length;
  const passedCount = findings.filter(f => !f.locked && f.passed).length;
  const lockedCount = findings.filter(f => f.locked).length;
  return h(View, null,
    h(Text, { style: styles.sectionTitle }, `Findings (${failedCount} issues, ${passedCount} passed, ${lockedCount} in your plan)`),
    ...findings.map((f, i) => f.locked ? h(LockedFinding, { key: i, f }) : h(UnlockedFinding, { key: i, f }))
  );
}

function Footer() {
  return h(View, { style: styles.footer, fixed: true },
    h(Text, { style: styles.footerText }, 'Sample report - Igris Radar'),
    h(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` })
  );
}

function ReportDoc({ title, data }) {
  return h(Document, { title: `${title} - Sample Report` },
    h(Page, { size: 'A4', style: styles.page },
      h(Header),
      h(Text, { style: styles.title }, title),
      h(Text, { style: styles.subtitle }, data.url),
      h(Text, { style: styles.sampleTag }, 'Sample report - illustrative data'),
      h(ScoreBox, { score: data.score }),
      h(CategoryBreakdown, { categories: data.categories }),
      h(Findings, { findings: data.findings }),
      h(Footer)
    )
  );
}

async function main() {
  const outDir = join(process.cwd(), 'public', 'sample-reports');
  mkdirSync(outDir, { recursive: true });

  for (const { key, title, data } of ALL_REPORTS) {
    const buffer = await renderToBuffer(h(ReportDoc, { title, data }));
    const outPath = join(outDir, `igris-radar-sample-${key}-report.pdf`);
    writeFileSync(outPath, buffer);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
