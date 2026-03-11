import { execSync } from 'child_process';

try {
  console.log('Running npm install to fix dependencies...');
  execSync('npm install', { cwd: '/vercel/share/v0-project', stdio: 'inherit' });
  console.log('Successfully regenerated package-lock.json');
} catch (error) {
  console.error('Error running npm install:', error.message);
  process.exit(1);
}
