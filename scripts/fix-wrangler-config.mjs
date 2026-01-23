#!/usr/bin/env node
/**
 * Post-build script to fix Astro-generated wrangler.json
 * Changes ASSETS binding to STATIC_ASSETS to avoid reserved name conflict
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const distWorkerPath = join(process.cwd(), 'dist', '_worker.js');
const wranglerJsonPath = join(distWorkerPath, 'wrangler.json');

// Fix wrangler.json
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

// Fix references in generated worker code
function replaceInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Replace env.ASSETS with env.STATIC_ASSETS
    content = content.replace(/env\.ASSETS\b/g, 'env.STATIC_ASSETS');
    // Replace 'ASSETS' string references in object access patterns
    content = content.replace(/\[['"]ASSETS['"]\]/g, '["STATIC_ASSETS"]');
    // Replace ASSETS: in object literals
    content = content.replace(/\bASSETS\s*:/g, 'STATIC_ASSETS:');
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Recursively find and fix .mjs and .js files in dist/_worker.js
function fixWorkerFiles(dir) {
  try {
    const entries = readdirSync(dir);
    let fixedCount = 0;
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixedCount += fixWorkerFiles(fullPath);
      } else if (stat.isFile() && (extname(entry) === '.mjs' || extname(entry) === '.js')) {
        if (replaceInFile(fullPath)) {
          fixedCount++;
        }
      }
    }
    
    return fixedCount;
  } catch (error) {
    return 0;
  }
}

const fixedFiles = fixWorkerFiles(distWorkerPath);
if (fixedFiles > 0) {
  console.log(`✓ Updated ASSETS references in ${fixedFiles} worker file(s)`);
}
