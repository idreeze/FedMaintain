import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = 'C:\\Users\\IDREEZE\\.gemini\\antigravity\\scratch\\fedmaintain\\screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAdminToken() {
  const res = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fedmaintain.com', password: 'Admin@123' })
  });
  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }
  const data = await res.json();
  return { token: data.token, user: data.user };
}

async function main() {
  console.log('[1/5] Authenticating to get admin JWT token...');
  const { token, user } = await getAdminToken();
  console.log('Obtained token:', token.substring(0, 25) + '...', 'User:', user.name);

  console.log('[2/5] Launching Chrome in headless mode with remote debugging port 9224...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(2500);

  console.log('[3/5] Querying CDP target endpoints...');
  const versionRes = await fetch('http://127.0.0.1:9224/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log('Connecting to WebSocket:', pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let messageId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('[4/5] Injecting authentication credentials into frontend localStorage...');
  await sendCommand('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(2000);

  // Set localStorage
  const userJsonStr = JSON.stringify(user);
  const injectCode = `
    localStorage.setItem('fedmaintain_token', ${JSON.stringify(token)});
    localStorage.setItem('fedmaintain_user', ${JSON.stringify(userJsonStr)});
  `;

  const pagesToCapture = [
    { name: '01_Real_Login_Page.png', url: 'http://localhost:5173/login', clearAuth: true },
    { name: '02_Real_Overview_Dashboard.png', url: 'http://localhost:5173/dashboard' },
    { name: '03_Real_Digital_Twins_Fleet.png', url: 'http://localhost:5173/digital-twins' },
    { name: '04_Real_Digital_Twin_Detail_CMP001.png', url: 'http://localhost:5173/digital-twins/1' },
    { name: '05_Real_Machine_Monitoring_Telemetry.png', url: 'http://localhost:5173/machines/1/monitoring' },
    { name: '06_Real_RUL_Predictions_Model.png', url: 'http://localhost:5173/machines/1/predictions' },
    { name: '07_Real_Machine_Health_Score.png', url: 'http://localhost:5173/machines/1/health' },
    { name: '08_Real_Predictive_Maintenance_Alerts.png', url: 'http://localhost:5173/alerts' },
    { name: '09_Real_Federated_Learning_Management.png', url: 'http://localhost:5173/federated' },
    { name: '10_Real_Plant_Asset_Management.png', url: 'http://localhost:5173/plants' }
  ];

  console.log('[5/5] Capturing real React UI screens...');
  for (const p of pagesToCapture) {
    if (p.clearAuth) {
      await sendCommand('Runtime.evaluate', { expression: `localStorage.clear()` });
      await sendCommand('Page.navigate', { url: p.url });
      await sleep(2500);
    } else {
      // Navigate to page first, inject auth, and reload so React AuthContext picks it up cleanly
      await sendCommand('Runtime.evaluate', { expression: injectCode });
      await sendCommand('Page.navigate', { url: p.url });
      await sleep(1000);
      await sendCommand('Runtime.evaluate', { expression: injectCode });
      // Allow React components, API calls and Recharts charts to render cleanly
      await sleep(4000);
    }

    console.log(`Capturing ${p.url} -> saving to ${p.name}...`);
    const shotRes = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOTS_DIR, p.name);
    fs.writeFileSync(filePath, Buffer.from(shotRes.data, 'base64'));
    const stats = fs.statSync(filePath);
    console.log(`Saved: ${filePath} (${Math.round(stats.size / 1024)} KB)`);
  }

  ws.close();
  chromeProc.kill();
  console.log('SUCCESS: All 10 real screenshots captured successfully!');
}

main().catch((err) => {
  console.error('ERROR in capture script:', err);
  process.exit(1);
});
