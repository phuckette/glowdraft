import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));

/* The news sweep runs here, not in the browser, so the API key never ships
   to the client. Set ANTHROPIC_API_KEY in Railway's Variables tab. */
app.post("/api/news", async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "no_key" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: String(req.body.prompt || "").slice(0, 8000) }],
      }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "upstream_failed" });
  }
});

app.get("/healthz", (_req, res) => res.send("ok"));
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`glow-draft on :${port}`));
