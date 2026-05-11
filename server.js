const express = require("express");
const app = express();

const USERNAME = process.env.WEBHOOK_USERNAME || "admin";
const PASSWORD = process.env.WEBHOOK_PASSWORD || "secret";
const PORT = process.env.PORT || 3000;
const AUTH_ENABLED = process.env.AUTH_ENABLED !== "false";

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

app.post("/webhook", checkAuth, (req, res) => {
  const { identifier, date, content, tagType, structured } = req.body;

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
  console.log(`\nEndpoint: http://localhost:${PORT}/webhook`);
  console.log(`\nWaiting for webhooks...\n`);
});
