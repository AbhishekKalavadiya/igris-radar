import { v4 as uuidv4 } from 'uuid';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { getUserSettings } from '@/lib/settings';
import { sendEmail } from '@/lib/email/mailer';
import { monitoringAlertEmail } from '@/lib/email/templates';
import { runSeoScan } from '../seoScanner.js';
import { runAeoScan } from '../aeoScanner.js';
import { runGeoScan } from '../geoScanner.js';
import { runSecurityScan } from '../securityScanner.js';

const SCAN_RUNNERS = {
  seo: { run: runSeoScan, collection: COLLECTIONS.SEO_SCANS },
  aeo: { run: runAeoScan, collection: COLLECTIONS.AEO_SCANS },
  geo: { run: runGeoScan, collection: COLLECTIONS.GEO_SCANS },
  security: { run: runSecurityScan, collection: COLLECTIONS.SECURITY_SCANS },
};

const FREQUENCY_HOURS = { daily: 24, weekly: 168, monthly: 720 };

/**
 * Runs every enabled scheduled audit that is due (per its daily/weekly/monthly
 * frequency), persists the scan result to the matching scan collection (so
 * history, trends and the weekly digest all pick it up), and emails the owner
 * when the score falls below their alert threshold.
 */
export async function processScheduledAudits() {
  const col = await getCollection(COLLECTIONS.SCHEDULED_AUDITS);

  const audits = await col.find({ enabled: true }).toArray();
  const now = new Date();

  let processed = 0;
  let alerts = 0;

  for (const audit of audits) {
    const runner = SCAN_RUNNERS[audit.scanType];
    if (!runner) continue;

    let shouldRun = !audit.lastRunAt;
    if (audit.lastRunAt) {
      const hoursSince = (now - new Date(audit.lastRunAt)) / (1000 * 60 * 60);
      shouldRun = hoursSince >= (FREQUENCY_HOURS[audit.frequency] || 168);
    }
    if (!shouldRun) continue;

    try {
      // Run at the audit owner's plan tier so tier-gated checks (e.g. Core Web
      // Vitals) execute. Non-SEO runners ignore the extra options argument.
      const usersCol = await getCollection(COLLECTIONS.USERS);
      const owner = await usersCol.findOne({ id: audit.userId }, { projection: { plan: 1 } });
      const result = await runner.run(audit.url, { plan: owner?.plan || 'free' });
      if (!result) continue;

      // Persist like a manual scan so trends/history/digest include it
      const scansCol = await getCollection(runner.collection);
      await scansCol.insertOne({
        id: uuidv4(),
        userId: audit.userId,
        url: audit.url,
        score: result.score,
        categories: result.categories || null,
        findings: result.findings || [],
        source: 'scheduled',
        createdAt: now,
      });

      // Threshold breach → audit trail + email alert (best-effort)
      if (result.score < audit.alertThreshold) {
        alerts++;
        const logsCol = await getCollection(COLLECTIONS.AUDIT_LOGS);
        await logsCol.insertOne({
          id: uuidv4(),
          userId: audit.userId,
          action: 'audit.alert',
          metadata: { url: audit.url, score: result.score, threshold: audit.alertThreshold, type: audit.scanType },
          createdAt: now,
        });

        try {
          const info = await getUserSettings(audit.userId);
          if (info?.settings.notifications.emailAlerts && info.email) {
            const mail = monitoringAlertEmail({
              name: info.name,
              scanType: audit.scanType,
              url: audit.url,
              score: result.score,
              threshold: audit.alertThreshold,
              frequency: audit.frequency,
            });
            await sendEmail({ to: info.email, ...mail });
          }
        } catch (mailErr) {
          console.error('[scheduler] alert email failed:', mailErr.message);
        }
      }

      await col.updateOne({ id: audit.id }, { $set: { lastRunAt: now } });
      processed++;
    } catch (e) {
      console.error(`Scheduled scan failed for ${audit.url}:`, e);
    }
  }

  return { success: true, processed, alerts };
}
