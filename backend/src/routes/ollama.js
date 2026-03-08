const express = require("express");
const crypto = require("crypto");
const http = require("http");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://10.10.10.1:11434";

// Store API keys in AuditLog as a lightweight approach (no schema change needed)
// action = "ollama_api_key", metadata = { key, active }

// Get or create Ollama API key for the current user
router.get("/api-key", auth, async (req, res, next) => {
  try {
    // Check for existing key
    const existing = await prisma.auditLog.findFirst({
      where: {
        userId: req.userId,
        action: "ollama_api_key",
        metadata: { path: ["active"], equals: true }
      }
    });

    if (existing) {
      return res.json({
        apiKey: existing.metadata.key,
        createdAt: existing.createdAt,
        endpoint: "https://cloudcode.space/api/ollama/v1",
        internalEndpoint: "http://10.10.10.1:11434",
        models: ["mistral", "llama3.2:3b", "qwen2.5:3b", "gemma2:2b"]
      });
    }

    // Generate new key
    const apiKey = "sk-cc-" + crypto.randomBytes(24).toString("hex");

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: "ollama_api_key",
        metadata: { key: apiKey, active: true }
      }
    });

    res.json({
      apiKey,
      createdAt: new Date(),
      endpoint: "https://cloudcode.space/api/ollama/v1",
      internalEndpoint: "http://10.10.10.1:11434",
      models: ["mistral", "llama3.2:3b", "qwen2.5:3b", "gemma2:2b"]
    });
  } catch (err) {
    next(err);
  }
});

// Regenerate API key
router.post("/api-key/regenerate", auth, async (req, res, next) => {
  try {
    // Deactivate old keys
    const oldKeys = await prisma.auditLog.findMany({
      where: {
        userId: req.userId,
        action: "ollama_api_key",
        metadata: { path: ["active"], equals: true }
      }
    });

    for (const old of oldKeys) {
      await prisma.auditLog.update({
        where: { id: old.id },
        data: { metadata: { ...old.metadata, active: false } }
      });
    }

    // Generate new key
    const apiKey = "sk-cc-" + crypto.randomBytes(24).toString("hex");

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: "ollama_api_key",
        metadata: { key: apiKey, active: true }
      }
    });

    res.json({
      apiKey,
      createdAt: new Date(),
      endpoint: "https://cloudcode.space/api/ollama/v1",
      internalEndpoint: "http://10.10.10.1:11434",
      models: ["mistral", "llama3.2:3b", "qwen2.5:3b", "gemma2:2b"]
    });
  } catch (err) {
    next(err);
  }
});

// Validate API key middleware
async function validateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "API key required. Use Authorization: Bearer sk-cc-..." });
  }

  const apiKey = authHeader.slice(7);

  const keyRecord = await prisma.auditLog.findFirst({
    where: {
      action: "ollama_api_key",
      metadata: { path: ["key"], equals: apiKey }
    }
  });

  if (!keyRecord || !keyRecord.metadata.active) {
    return res.status(401).json({ error: "Invalid or deactivated API key" });
  }

  // Check user has an active subscription
  const user = await prisma.user.findUnique({
    where: { id: keyRecord.userId },
    include: { org: { include: { subscription: true } } }
  });

  if (!user || user.suspended) {
    return res.status(403).json({ error: "Account suspended" });
  }

  const hasActiveSub = user.org?.subscription &&
    ["active", "trialing"].includes(user.org.subscription.status);

  if (!hasActiveSub) {
    return res.status(403).json({ error: "Active subscription required to use the AI API" });
  }

  req.ollamaUserId = keyRecord.userId;
  next();
}

// Proxy to Ollama - generate endpoint
router.post("/v1/generate", validateApiKey, (req, res) => {
  proxyToOllama("/api/generate", req, res);
});

// Proxy to Ollama - chat endpoint
router.post("/v1/chat", validateApiKey, (req, res) => {
  proxyToOllama("/api/chat", req, res);
});

// Proxy to Ollama - list models
router.get("/v1/models", validateApiKey, (req, res) => {
  proxyToOllama("/api/tags", req, res, "GET");
});

// Proxy to Ollama - embeddings
router.post("/v1/embeddings", validateApiKey, (req, res) => {
  proxyToOllama("/api/embeddings", req, res);
});

function proxyToOllama(path, req, res, method = "POST") {
  const url = new URL(OLLAMA_HOST);
  const options = {
    hostname: url.hostname,
    port: url.port || 11434,
    path: path,
    method: method,
    headers: { "Content-Type": "application/json" }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Ollama proxy error:", err);
    res.status(502).json({ error: "AI service unavailable" });
  });

  proxyReq.setTimeout(300000, () => {
    proxyReq.destroy();
    res.status(504).json({ error: "AI request timed out" });
  });

  if (method === "POST") {
    const body = JSON.stringify(req.body);
    proxyReq.write(body);
  }

  proxyReq.end();
}

module.exports = router;
