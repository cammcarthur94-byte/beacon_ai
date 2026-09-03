import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('.next/server/app/index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('index.html not found at', htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Check nested button in a
const nestedMatches = [...html.matchAll(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<button\b[\s\S]*?<\/button>[\s\S]*?<\/a>/gi)];
console.log('Nested <button> in <a> count:', nestedMatches.length);
nestedMatches.forEach((m, idx) => {
  console.log(`[${idx + 1}]`, m[0].substring(0, 120).replace(/\s+/g, ' '));
});
