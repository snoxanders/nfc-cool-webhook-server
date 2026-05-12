const express = require("express");
const app = express();

const USERNAME = process.env.WEBHOOK_USERNAME || "admin";
const PASSWORD = process.env.WEBHOOK_PASSWORD || "secret";
const PORT = process.env.PORT || 3000;
const AUTH_ENABLED = process.env.AUTH_ENABLED !== "false";

const webhookHistory = [];

app.use(express.json());

function checkAuth(req, res, next) {
  if (!AUTH_ENABLED) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="NFC.cool Webhook"');
    return res.status(401).json({ error: "Authentication required" });
  }

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
  const [user, pass] = decoded.split(":");

  if (user === USERNAME && pass === PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
}

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFC.cool Webhook Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1117; color: #e4e4e7; min-height: 100vh; }
    .header { padding: 24px 32px; border-bottom: 1px solid #27272a; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 20px; font-weight: 600; }
    .header .badge { background: ${AUTH_ENABLED ? '#22c55e' : '#f59e0b'}; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status { padding: 16px 32px; background: #18181b; border-bottom: 1px solid #27272a; font-size: 13px; color: #a1a1aa; }
    .status span { color: #22c55e; }
    .container { padding: 24px 32px; }
    .empty { text-align: center; padding: 80px 0; color: #52525b; }
    .empty .icon { font-size: 48px; margin-bottom: 16px; }
    .empty p { font-size: 14px; }
    .webhook { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; }
    .webhook-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .webhook-time { font-size: 12px; color: #71717a; }
    .webhook-type { font-size: 11px; padding: 2px 8px; border-radius: 8px; font-weight: 600; }
    .type-plain { background: #1e3a5f; color: #60a5fa; }
    .type-openprinttag { background: #1a3320; color: #4ade80; }
    .webhook-fields { display: grid; gap: 8px; }
    .field { display: flex; gap: 12px; font-size: 13px; }
    .field-label { color: #71717a; min-width: 80px; }
    .field-value { color: #e4e4e7; word-break: break-all; }
    .structured { margin-top: 12px; padding: 12px; background: #09090b; border-radius: 8px; }
    .structured pre { font-size: 12px; color: #a1a1aa; white-space: pre-wrap; font-family: 'SF Mono', Monaco, monospace; }
    .structured-label { font-size: 11px; color: #52525b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>NFC.cool Webhook Server</h1>
    <span class="badge">${AUTH_ENABLED ? 'Auth Enabled' : 'No Auth'}</span>
  </div>
  <div class="status">
    Listening on <span>http://localhost:${PORT}/webhook</span>
    ${AUTH_ENABLED ? ' &middot; Credentials: <span>' + USERNAME + '</span> / <span>' + PASSWORD + '</span>' : ''}
  </div>
  <div class="container" id="webhooks">
    <div class="empty"><div class="icon">📡</div><p>No webhooks received yet.<br>Scan an NFC tag with NFC.cool to see data here.</p></div>
  </div>
  <script>
    setInterval(() => fetch('/api/webhooks').then(r => r.json()).then(data => {
      const el = document.getElementById('webhooks');
      if (data.length === 0) {
        el.innerHTML = '<div class="empty"><div class="icon">📡</div><p>No webhooks received yet.<br>Scan an NFC tag with NFC.cool to see data here.</p></div>';
      } else {
        el.innerHTML = data.map(w => {
          const isOpt = w.tagType === 'openPrintTag';
          return '<div class="webhook">' +
            '<div class="webhook-header">' +
              '<span class="webhook-type ' + (isOpt ? 'type-openprinttag' : 'type-plain') + '">' + (isOpt ? 'OpenPrintTag' : 'NFC Tag') + '</span>' +
              '<span class="webhook-time">' + new Date(w.receivedAt).toLocaleTimeString() + '</span>' +
            '</div>' +
            '<div class="webhook-fields">' +
              '<div class="field"><span class="field-label">Identifier</span><span class="field-value">' + (w.identifier || '-') + '</span></div>' +
              '<div class="field"><span class="field-label">Content</span><span class="field-value">' + (w.content || '-') + '</span></div>' +
              '<div class="field"><span class="field-label">Date</span><span class="field-value">' + (w.date || '-') + '</span></div>' +
            '</div>' +
            (w.structured ? '<div class="structured"><div class="structured-label">Structured Data</div><pre>' + JSON.stringify(w.structured, null, 2) + '</pre></div>' : '') +
          '</div>';
        }).join('');
      }
    }), 2000);
  </script>
</body>
</html>`);
});

app.get("/api/webhooks", (req, res) => {
  res.json(webhookHistory);
});

app.post("/webhook", checkAuth, (req, res) => {
  const { identifier, date, content, tagType, structured } = req.body;

  const entry = { identifier, date, content, tagType, structured, receivedAt: new Date().toISOString() };
  webhookHistory.unshift(entry);
  if (webhookHistory.length > 50) webhookHistory.pop();

  console.log("\n--- Webhook Received ---");
  console.log(`  Identifier: ${identifier}`);
  console.log(`  Date:       ${date}`);
  console.log(`  Content:    ${content}`);
  if (tagType) {
    console.log(`  Tag Type:   ${tagType}`);
    console.log(`  Structured: ${JSON.stringify(structured, null, 4)}`);
  }
  console.log("------------------------\n");

  res.json({ status: "ok", message: "Webhook received successfully" });
});

app.listen(PORT, () => {
  console.log(`NFC.cool Webhook Server running on port ${PORT}`);
  console.log(`Authentication: ${AUTH_ENABLED ? "enabled" : "disabled"}`);
  if (AUTH_ENABLED) {
    console.log(`Credentials: ${USERNAME} / ${PASSWORD}`);
  }
  console.log(`\nDashboard: http://localhost:${PORT}`);
  console.log(`Endpoint:  http://localhost:${PORT}/webhook`);
  console.log(`\nWaiting for webhooks...\n`);
});
