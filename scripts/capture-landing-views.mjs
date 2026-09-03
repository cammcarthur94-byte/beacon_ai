import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('public/screenshots/landing');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const viewports = [
  { name: 'landing-desktop-1440.png', width: 1440, height: 900 },
  { name: 'landing-tablet-768.png', width: 768, height: 1024 },
  { name: 'landing-mobile-375.png', width: 375, height: 812 },
  { name: 'landing-mobile-narrow-320.png', width: 320, height: 600 },
];

async function main() {
  let server = null;
  let ready = false;

  try {
    const res = await fetch('http://127.0.0.1:3000');
    if (res.status === 200) {
      ready = true;
      console.log('Server already running on port 3000.');
    }
  } catch {}

  if (!ready) {
    console.log('Starting Next.js production server...');
    server = spawn('npx.cmd', ['next', 'start', '-p', '3000'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:3000');
        if (res.status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!ready) {
    console.error('Failed to start server.');
    if (server) server.kill();
    process.exit(1);
  }

  console.log('Server running. Capturing viewport screenshots...');

  for (const vp of viewports) {
    const outputPath = path.join(OUTPUT_DIR, vp.name);
    const chromeCmd = `"${CHROME_PATH}" --headless=new --disable-gpu --window-size=${vp.width},${vp.height} --hide-scrollbars --screenshot="${outputPath}" "http://127.0.0.1:3000/"`;
    try {
      execSync(chromeCmd, { timeout: 15000, stdio: 'pipe' });
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`✓ Generated ${vp.name} (${(stats.size / 1024).toFixed(1)} KB)`);
      }
    } catch (e) {
      console.error(`Error capturing ${vp.name}:`, e.message);
    }
  }

  // Also test anchor navigation
  const anchorOutput = path.join(OUTPUT_DIR, 'landing-anchor-google-ai.png');
  const anchorCmd = `"${CHROME_PATH}" --headless=new --disable-gpu --window-size=1440,900 --hide-scrollbars --screenshot="${anchorOutput}" "http://127.0.0.1:3000/#google-ai"`;
  try {
    execSync(anchorCmd, { timeout: 15000, stdio: 'pipe' });
    console.log(`✓ Generated landing-anchor-google-ai.png`);
  } catch (e) {
    console.error('Error capturing anchor:', e.message);
  }

  if (server) {
    server.kill('SIGTERM');
  }
  console.log('Viewport verification completed.');
}

main().catch(console.error);
