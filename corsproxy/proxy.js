const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 8787;

app.get("/conference.json", async (req, res) => {
  try {
    const upstream = "https://2026.everythingopen.au/schedule/conference.json";
    const r = await fetch(upstream, { headers: { "User-Agent": "eo-local-test-proxy" } });

    if (!r.ok) {
      res.status(r.status).send(`Upstream error: ${r.status}`);
      return;
    }

    const text = await r.text();

    // CORS headers:
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.type("application/json").send(text);
  } catch (e) {
    res.status(500).send(String(e));
  }
});

app.listen(PORT, () => console.log(`EO proxy listening on http://localhost:${PORT}`));
