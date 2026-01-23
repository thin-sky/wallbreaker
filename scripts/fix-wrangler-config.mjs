#!/usr/bin/env node
/**
 * Post-build script to fix Astro-generated wrangler.json
 * Changes ASSETS binding to STATIC_ASSETS to avoid reserved name conflict
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const wranglerJsonPath = join(process.cwd(), 'dist', '_worker.js', 'wrangler.json');

// Fix wrangler.json binding name
try {
  const config = JSON.parse(readFileSync(wranglerJsonPath, 'utf-8'));
  
  // Replace ASSETS binding with STATIC_ASSETS if it exists
  if (config.assets && config.assets.binding === 'ASSETS') {
    config.assets.binding = 'STATIC_ASSETS';
    writeFileSync(wranglerJsonPath, JSON.stringify(config, null, 2));
    console.log('✓ Fixed ASSETS binding name to STATIC_ASSETS in wrangler.json');
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.warn('⚠ wrangler.json not found, skipping config fix');
  } else {
    console.error('✗ Error fixing wrangler.json:', error.message);
    process.exit(1);
  }
}
