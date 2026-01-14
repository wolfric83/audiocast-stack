const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 8787;

const UPSTREAM = "https://2026.everythingopen.au/schedule/conference.json";
const TTL_MS = 5 * 60 * 1000;

// In-memory cache
let cacheBody = null;
let cacheAt = 0;
let refreshPromise = null;

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function fetchUpstream() {
  log("Cache MISS -> fetching upstream JSON…");

  const r = await fetch(UPSTREAM, {
    headers: { "User-Agent": "eo-local-test-proxy" },
  });

  if (!r.ok) {
    const err = new Error(`Upstream error: ${r.status}`);
    err.status = r.status;
    throw err;
  }

  return await r.text();
}

async function getCachedOrRefresh() {
  const now = Date.now();

  // Fresh cache
  if (cacheBody !== null && (now - cacheAt) < TTL_MS) {
    log("Cache HIT -> serving cached JSON");
    return { body: cacheBody, fromCache: true };
  }

  // Refresh already in progress
  if (refreshPromise) {
    log("Cache STALE -> waiting for in-flight refresh");
    const body = await refreshPromise;
    return { body, fromCache: false };
  }

  // Start refresh
  refreshPromise = (async () => {
    try {
      const body = await fetchUpstream();
      cacheBody = body;
      cacheAt = Date.now();
      log("Cache UPDATED -> new JSON stored");
      return body;
    } finally {
      refreshPromise = null;
    }
  })();

  const body = await refreshPromise;
  return { body, fromCache: false };
}

// Preflight
app.options("/conference.json", (req, res) => {
  setCors(res);
  res.sendStatus(204);
});

app.get("/conference.json", async (req, res) => {
  setCors(res);

  try {
    const { body, fromCache } = await getCachedOrRefresh();
    res.setHeader("X-EO-Proxy-Cache", fromCache ? "HIT" : "MISS");
    res.type("application/json").send(body);
  } catch (e) {
    if (cacheBody !== null) {
      log(`Upstream FAILED -> serving STALE cache (${e.message})`);
      res.setHeader("X-EO-Proxy-Cache", "STALE");
      res.setHeader("X-EO-Proxy-Error", e.message);
      res.type("application/json").send(cacheBody);
      return;
    }

    log(`Upstream FAILED -> no cache available (${e.message})`);
    const status = e.status || 500;
    res.status(status).send(e.message);
  }
});

app.listen(PORT, () => {
  log(`EO proxy listening on http://localhost:${PORT}`);
});
