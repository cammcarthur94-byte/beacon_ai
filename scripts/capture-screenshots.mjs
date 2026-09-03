import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('public/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const targets = [
  { name: 'dashboard.png', url: 'http://127.0.0.1:3000/dashboard', waitMs: 2500 },
  { name: 'audits.png', url: 'http://127.0.0.1:3000/audits', waitMs: 2000 },
  { name: 'citations.png', url: 'http://127.0.0.1:3000/citations', waitMs: 2000 },
  { name: 'reports.png', url: 'http://127.0.0.1:3000/reports', waitMs: 2000 },
  { name: 'consultant.png', url: 'http://127.0.0.1:3000/consultant', waitMs: 2000 },
  { name: 'onboarding.png', url: 'http://127.0.0.1:3000/onboarding', waitMs: 1500 },
  { name: 'login.png', url: 'http://127.0.0.1:3000/login', waitMs: 1500 },
];

async function main() {
  let server = null;

  // Check if port 3000 is already running
  let ready = false;
  try {
    const res = await fetch('http://127.0.0.1:3000/dashboard');
    if (res.status === 200 || res.status === 307 || res.status === 308) {
      ready = true;
      console.log('Detected active Next.js server on http://127.0.0.1:3000. Reusing existing instance.');
    }
  } catch {}

  if (!ready) {
    console.log('--- Starting Next.js Production Server for Screenshot Capture ---');
    server = spawn('npx.cmd', ['next', 'start', '-p', '3000'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    server.stdout.on('data', (d) => process.stdout.write(d.toString()));
    server.stderr.on('data', (d) => process.stderr.write(d.toString()));

    // Wait for server to become responsive
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://localhost:3000');
        if (res.status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!ready) {
    console.error('Server failed to start within 15 seconds.');
    if (server) server.kill();
    process.exit(1);
  }

  console.log('Server is ready. Capturing screenshots using Headless Chrome...');

  for (const target of targets) {
    const outputPath = path.join(OUTPUT_DIR, target.name);
    console.log(`Capturing ${target.url} -> ${target.name}...`);
    
    // Command line Chrome screenshot
    const chromeCmd = `"${CHROME_PATH}" --headless=new --disable-gpu --window-size=1440,900 --hide-scrollbars --screenshot="${outputPath}" "${target.url}"`;
    try {
      execSync(chromeCmd, { timeout: 15000, stdio: 'pipe' });
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`✓ Generated ${target.name} (${(stats.size / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.error(`Error capturing ${target.name}:`, err.message);
    }
  }

  console.log('All screenshots captured successfully!');
  if (server) server.kill('SIGTERM');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
