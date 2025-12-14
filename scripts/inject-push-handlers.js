#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const pushSwPath = path.join(__dirname, '..', 'public', 'push-sw.js');

console.log('[Post-Build] Injecting push notification handlers into service worker...');

// Check if sw.js exists
if (!fs.existsSync(swPath)) {
  console.log('[Post-Build] sw.js not found - skipping (PWA disabled in development)');
  process.exit(0);
}

// Check if push-sw.js exists
if (!fs.existsSync(pushSwPath)) {
  console.error('[Post-Build] ERROR: push-sw.js not found!');
  process.exit(1);
}

try {
  // Read the generated service worker
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Check if already injected
  if (swContent.includes('importScripts(\'/push-sw.js\')')) {
    console.log('[Post-Build] Push handlers already injected - skipping');
    process.exit(0);
  }

  // Inject importScripts at the beginning of the file
  const importStatement = `// Import push notification handlers\nimportScripts('/push-sw.js');\n\n`;
  swContent = importStatement + swContent;

  // Write back to sw.js
  fs.writeFileSync(swPath, swContent, 'utf8');

  console.log('[Post-Build] ✓ Successfully injected push notification handlers into sw.js');
  process.exit(0);
} catch (error) {
  console.error('[Post-Build] ERROR injecting push handlers:', error);
  process.exit(1);
}
