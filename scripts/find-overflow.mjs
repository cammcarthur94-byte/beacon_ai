import http from 'http';
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOverflow() {
  // Launch Chrome headless with remote debugging port 9222
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\Cam\\AppData\\Local\\Temp\\chrome-debug-tmp',
    '--window-size=375,812',
    '--disable-gpu',
    'http://127.0.0.1:3000/',
  ]);

  // Wait for remote debugging to be ready
  await new Promise((r) => setTimeout(r, 3000));

  try {
    // Get target list
    const targetsRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      console.error('No page target found');
      chrome.kill();
      return;
    }

    // Connect WebSocket
    const WebSocket = (await import('ws')).default || globalThis.WebSocket;
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise((resolve) => ws.on('open', resolve));

    // Send Runtime.evaluate to find overflowing elements
    const evalPromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === 1) {
          resolve(msg.result);
        }
      });
    });

    ws.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const results = [];
            const docWidth = document.documentElement.clientWidth;
            document.querySelectorAll('*').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.right > docWidth + 1) {
                results.push({
                  tag: el.tagName,
                  id: el.id,
                  className: el.className ? el.className.toString().substring(0, 80) : '',
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                  overflow: Math.round(rect.right - docWidth)
                });
              }
            });
            return {
              docWidth,
              scrollWidth: document.documentElement.scrollWidth,
              bodyScrollWidth: document.body.scrollWidth,
              overflowCount: results.length,
              topOverflows: results.slice(0, 10)
            };
          })()`,
          returnByValue: true,
        },
      })
    );

    const res = await evalPromise;
    console.log('DOM Evaluation Result:', JSON.stringify(res, null, 2));

    ws.close();
  } catch (e) {
    console.error('Error during inspection:', e);
  } finally {
    chrome.kill();
  }
}

testOverflow();
