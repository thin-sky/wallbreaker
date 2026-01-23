import type { Env } from '../types';
import { backupAnalyticsToR2, deleteOldR2Backups } from '@/lib/backup/r2';
import {
  deleteOldPageviews,
  deleteOldAnalyticsEvents,
} from '@/lib/db/analytics';
import { deleteOldWebhookEvents } from '@/lib/db/webhooks';
import { deleteOldEcommerceEvents } from '@/lib/db/ecommerce';

/**
 * Scheduled handler for cron triggers
 * Configured in wrangler.toml:
 * - Weekly backup: Sundays at 2am UTC
 * - Daily reconciliation: 3am UTC
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const cron = event.cron;
    
    console.log(`Cron job triggered: ${cron} at ${new Date().toISOString()}`);
    
    // Weekly backup (Sundays at 2am UTC)
    if (cron === '0 2 * * 0') {
      ctx.waitUntil(runWeeklyBackup(env));
    }
    
    // Daily reconciliation (3am UTC)
    if (cron === '0 3 * * *') {
      ctx.waitUntil(runDailyReconciliation(env));
    }
  },
};

/**
 * Weekly backup job
 * - Backs up analytics data to R2
 * - Deletes old backups (>1 year)
 * - Cleans up old data from D1 (>90 days)
 */
async function runWeeklyBackup(env: Env): Promise<void> {
  try {
    console.log('Starting weekly backup job...');
    
    // 1. Backup analytics to R2
    const backup = await backupAnalyticsToR2(env.DB, env.BACKUPS);
    console.log(`Backup completed: ${backup.key} (${backup.size} bytes)`);
    
    // 2. Delete old backups from R2 (older than 1 year)
    const deletedBackups = await deleteOldR2Backups(env.BACKUPS, 365);
    console.log(`Deleted ${deletedBackups} old backups from R2`);
    
    // 3. Clean up old analytics from D1 (older than 90 days)
    const deletedPageviews = await deleteOldPageviews(env.DB, 90);
    const deletedEvents = await deleteOldAnalyticsEvents(env.DB, 90);
    const deletedEcommerce = await deleteOldEcommerceEvents(env.DB, 90);
    console.log(`Deleted ${deletedPageviews} old pageviews, ${deletedEvents} old events, and ${deletedEcommerce} old ecommerce events from D1`);
    
    // 4. Clean up old webhook events (older than 90 days)
    const deletedWebhooks = await deleteOldWebhookEvents(env.DB, 90);
    console.log(`Deleted ${deletedWebhooks} old webhook events from D1`);
    
    console.log('Weekly backup job completed successfully');
  } catch (error) {
    console.error('Error in weekly backup job:', error);
    throw error;
  }
}

/**
 * Daily reconciliation job
 * - Checks for missed webhook events from Fourthwall
 * - Verifies data consistency
 * - Performs any necessary cleanup
 */
async function runDailyReconciliation(env: Env): Promise<void> {
  try {
    console.log('Starting daily reconciliation job...');
    
    // TODO: Implement reconciliation logic
    // - Fetch recent orders from Fourthwall API
    // - Compare with processed webhooks
    // - Process any missed events
    
    // For now, just log that reconciliation ran
    console.log('Daily reconciliation: No implementation yet');
    
    console.log('Daily reconciliation job completed');
  } catch (error) {
    console.error('Error in daily reconciliation job:', error);
    throw error;
  }
}
