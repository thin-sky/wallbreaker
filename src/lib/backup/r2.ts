import { exportAnalyticsData } from '@/lib/db/analytics';
import { exportEcommerceData } from '@/lib/db/ecommerce';
import { z } from 'zod';

/**
 * Backup analytics data to R2
 * @param db D1 database instance
 * @param bucket R2 bucket instance
 * @returns Backup metadata
 */
export async function backupAnalyticsToR2(
  db: D1Database,
  bucket: R2Bucket
): Promise<{ success: boolean; key: string; size: number }> {
  try {
    // Export all analytics and ecommerce data
    const [analyticsData, ecommerceData] = await Promise.all([
      exportAnalyticsData(db),
      exportEcommerceData(db),
    ]);
    
    // Create backup object
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        ...analyticsData,
        ecommerce: ecommerceData,
      },
      metadata: {
        pageview_count: analyticsData.pageviews.length,
        event_count: analyticsData.events.length,
        ecommerce_count: ecommerceData.length,
      },
    };
    
    // Convert to JSON and compress
    const jsonString = JSON.stringify(backup, null, 2);
    const jsonBytes = new TextEncoder().encode(jsonString);
    
    // Generate key with date
    const date = new Date().toISOString().split('T')[0];
    const key = `backups/analytics/${date}.json`;
    
    // Upload to R2
    await bucket.put(key, jsonBytes, {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        backup_date: date,
        pageview_count: data.pageviews.length.toString(),
        event_count: data.events.length.toString(),
      },
    });
    
    console.log(`Analytics backup created: ${key} (${jsonBytes.length} bytes)`);
    
    return {
      success: true,
      key,
      size: jsonBytes.length,
    };
  } catch (error) {
    console.error('Error backing up analytics to R2:', error);
    throw error;
  }
}

/**
 * List available backups from R2
 * @param bucket R2 bucket instance
 * @param limit Maximum number of results
 * @returns List of backup keys and metadata
 */
export async function listR2Backups(
  bucket: R2Bucket,
  limit: number = 10
): Promise<Array<{
  key: string;
  size: number;
  uploaded: Date;
}>> {
  try {
    const list = await bucket.list({
      prefix: 'backups/analytics/',
      limit,
    });
    
    return list.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    }));
  } catch (error) {
    console.error('Error listing R2 backups:', error);
    throw error;
  }
}

/**
 * Restore analytics data from R2 backup
 * @param bucket R2 bucket instance
 * @param key Backup key to restore
 * @returns Restored backup data
 */
export async function restoreFromR2Backup(
  bucket: R2Bucket,
  key: string
): Promise<any> {
  try {
    const object = await bucket.get(key);
    
    if (!object) {
      throw new Error(`Backup not found: ${key}`);
    }
    
    const jsonString = await object.text();
    const backup = JSON.parse(jsonString);
    
    return backup;
  } catch (error) {
    console.error('Error restoring from R2 backup:', error);
    throw error;
  }
}

/**
 * Delete old backups from R2
 * @param bucket R2 bucket instance
 * @param olderThanDays Delete backups older than this many days
 * @returns Number of deleted backups
 */
export async function deleteOldR2Backups(
  bucket: R2Bucket,
  olderThanDays: number = 365
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const list = await bucket.list({
      prefix: 'backups/analytics/',
    });
    
    let deletedCount = 0;
    
    for (const obj of list.objects) {
      if (obj.uploaded < cutoffDate) {
        await bucket.delete(obj.key);
        deletedCount++;
        console.log(`Deleted old backup: ${obj.key}`);
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting old R2 backups:', error);
    throw error;
  }
}
