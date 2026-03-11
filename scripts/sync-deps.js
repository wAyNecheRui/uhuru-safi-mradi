import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('[v0] Starting dependency sync...');
  
  // Remove old lock file if it exists
  const lockPath = path.join(process.cwd(), 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('[v0] Removed old package-lock.json');
  }
  
  // Run npm install with legacy peer deps flag
  console.log('[v0] Running npm install...');
  execSync('npm install', { 
    stdio: 'inherit',
    env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
  });
  
  console.log('[v0] Dependencies synced successfully');
} catch (error) {
  console.error('[v0] Error syncing dependencies:', error.message);
  process.exit(1);
}
