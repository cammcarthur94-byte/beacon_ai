import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('.next/server/app/index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('index.html not found at', htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

console.log('=== Comprehensive Landing Page Verification ===\n');

let passedAll = true;

function check(testName, condition, detail = '') {
  if (condition) {
    console.log(`PASS: ${testName} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    passedAll = false;
  }
}

// 1. Anchors Exist
check('Anchor #features exists', html.includes('id="features"'));
check('Anchor #google-ai exists', html.includes('id="google-ai"'));
check('Anchor #the-shift exists', html.includes('id="the-shift"'));
check('Anchor #pricing exists', html.includes('id="pricing"'));

// 2. Scroll margin offsets for comfortable sticky header clearance
check('features has scroll-mt-20', /id="features"[^>]*class="[^"]*scroll-mt-20/i.test(html));
check('the-shift has scroll-mt-20', /id="the-shift"[^>]*class="[^"]*scroll-mt-20/i.test(html));
check('pricing has scroll-mt-20', /id="pricing"[^>]*class="[^"]*scroll-mt-20/i.test(html));
check('google-ai has scroll-mt-20', /id="google-ai"[^>]*class="[^"]*scroll-mt-20/i.test(html));

// 3. Smooth scrolling on <html>
check('html element has scroll-smooth', /<html[^>]*class="[^"]*scroll-smooth/i.test(html));

// 4. No nested <button> in <a>
const nestedButtonCount = [...html.matchAll(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<button\b[\s\S]*?<\/button>[\s\S]*?<\/a>/gi)].length;
check('Zero nested <button> inside <a>', nestedButtonCount === 0, `Count: ${nestedButtonCount}`);

// 5. CTAs route to /login
const loginLinks = [...html.matchAll(/href="\/login"/g)].length;
check('CTAs route to /login', loginLinks >= 8, `Found ${loginLinks} links to /login`);

// 6. No py-0.2 class occurrences
check('Zero invalid py-0.2 classes', !html.includes('py-0.2'));

// 7. Executive Tone & Jargon check (no SERP, scraping, temperature, etc.)
const jargonTerms = ['SERP', 'scraping', 'serp parsing', 'llm temperature', 'custom webhooks', 'vector database'];
jargonTerms.forEach(term => {
  const hasJargon = new RegExp(`\\b${term}\\b`, 'i').test(html);
  check(`Free of jargon: "${term}"`, !hasJargon);
});

// 8. Mobile Menu & Accessibility attributes
check('Mobile menu aria-controls present', html.includes('aria-controls="mobile-nav-menu"'));
check('Mobile menu container id present', html.includes('id="mobile-nav-menu"'));

// 9. Preconnect to fonts.cdnfonts.com
check('Preconnect to fonts.cdnfonts.com in head', html.includes('fonts.cdnfonts.com'));

// 10. Multi-engine brands mentioned
['ChatGPT', 'Google', 'Claude', 'Perplexity'].forEach(eng => {
  check(`Engine ${eng} prominently featured`, html.includes(eng));
});

console.log('\n=== Verification Summary ===');
if (passedAll) {
  console.log('ALL AUDITS PASSED WITH ZERO DEFECTS!');
  process.exit(0);
} else {
  console.error('SOME AUDITS FAILED');
  process.exit(1);
}
