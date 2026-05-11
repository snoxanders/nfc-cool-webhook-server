const express = require("express");
const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("\n=== FULL REQUEST BODY ===");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("========================\n");
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Debug server on port 3000 (NO AUTH)\n");
});
