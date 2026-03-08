#!/usr/bin/env node
/**
 * Reddit Social Listener
 * Monitors subreddits for keywords related to our business.
 * Logs opportunities for engagement and generates suggested responses via Ollama.
 *
 * Uses Reddit public JSON API - no auth needed for reading.
 * Saves found posts to a JSON file for review.
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const RESULTS_FILE = path.join(__dirname, ".reddit-opportunities.json");
const STATE_FILE = path.join(__dirname, ".reddit-monitor-state.json");
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

const KEYWORDS = [
  "claude code",
  "cloud development environment",
  "cloud desktop",
  "cloud computer",
  "remote desktop development",
  "vscode cloud",
  "cursor ai",
  "go high level",
  "gohighlevel",
  "start an agency",
  "starting a marketing agency",
  "digital agency tools",
  "ai coding assistant",
  "claude ai",
  "dev environment setup",
  "ubuntu cloud",
  "cloud ide",
  "ai business tools",
  "saas tools for agencies",
  "cheap cloud server",
  "free crm",
  "anthropic claude"
];

const SUBREDDITS = [
  "webdev",
  "programming",
  "SideProject",
  "Entrepreneur",
  "smallbusiness",
  "digital_marketing",
  "marketing",
  "SEO",
  "agency",
  "freelance",
  "startups",
  "SaaS",
  "devops",
  "selfhosted",
  "linux",
  "vscode",
  "ClaudeAI",
  "artificial",
  "MachineLearning",
  "coding"
];

function fetchReddit(subreddit) {
  return new Promise((resolve, reject) => {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;
    https.get(url, {
      headers: { "User-Agent": "CloudCodeBot/1.0 (content monitor)" }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && parsed.data.children) {
            resolve(parsed.data.children.map(c => c.data));
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      });
    }).on("error", () => resolve([]));
  });
}

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "mistral",
      prompt,
      stream: false,
      options: { temperature: 0.6, num_predict: 500 }
    });

    const req = http.request(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.response || "");
        } catch {
          resolve("");
        }
      });
    });

    req.on("error", () => resolve(""));
    req.setTimeout(120000, () => { req.destroy(); resolve(""); });
    req.write(body);
    req.end();
  });
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { seenIds: [], lastRun: null };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadResults() {
  try {
    return JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
  } catch {
    return { opportunities: [] };
  }
}

function saveResults(results) {
  results.opportunities = results.opportunities.slice(-200);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

function matchesKeywords(text) {
  const lower = text.toLowerCase();
  return KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
}

async function main() {
  console.log("Reddit monitor starting at " + new Date().toISOString());

  const state = loadState();
  const results = loadResults();
  const seenSet = new Set(state.seenIds);
  let newOpportunities = 0;

  for (const subreddit of SUBREDDITS) {
    try {
      const posts = await fetchReddit(subreddit);

      for (const post of posts) {
        if (seenSet.has(post.id)) continue;
        seenSet.add(post.id);

        const fullText = (post.title || "") + " " + (post.selftext || "");
        const matched = matchesKeywords(fullText);

        if (matched.length > 0) {
          console.log("Found: r/" + subreddit + ' - "' + post.title.slice(0, 80) + '..." [' + matched.join(", ") + "]");

          // Generate a helpful response suggestion using Ollama
          const responsePrompt = [
            "You are a helpful community member who runs CloudCode at cloudcode.space, a platform providing cloud dev environments with Claude Code, VS Code, and Cursor pre-installed, plus a free Go High Level CRM, starting at $17/mo.",
            "",
            "Someone posted on Reddit r/" + subreddit + ":",
            "Title: " + post.title,
            "Content: " + (post.selftext || "").slice(0, 500),
            "",
            "Write a helpful, genuine Reddit comment that actually answers their question or adds value. Only mention CloudCode if genuinely relevant. Sound like a real person, not a marketer. Keep it under 150 words. Do NOT include links unless absolutely necessary. Be genuinely helpful first."
          ].join("\n");

          let suggestedResponse = "";
          try {
            suggestedResponse = await callOllama(responsePrompt);
          } catch {
            suggestedResponse = "";
          }

          results.opportunities.push({
            id: post.id,
            subreddit,
            title: post.title,
            url: "https://reddit.com" + post.permalink,
            author: post.author,
            score: post.score,
            comments: post.num_comments,
            matchedKeywords: matched,
            selftext: (post.selftext || "").slice(0, 500),
            suggestedResponse: suggestedResponse.trim(),
            foundAt: new Date().toISOString(),
            responded: false
          });
          newOpportunities++;
        }
      }

      // Rate limit: wait 2s between subreddit fetches
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error("Error fetching r/" + subreddit + ": " + err.message);
    }
  }

  // Update state
  state.seenIds = Array.from(seenSet).slice(-5000);
  state.lastRun = new Date().toISOString();
  state.totalOpportunities = results.opportunities.length;
  saveState(state);
  saveResults(results);

  console.log("Done. Found " + newOpportunities + " new opportunities. Total: " + results.opportunities.length);
}

main().catch(err => console.error("Fatal:", err));
