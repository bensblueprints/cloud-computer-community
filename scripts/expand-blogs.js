#!/usr/bin/env node
/**
 * Blog Content Expansion Cron
 * Runs every 10 minutes, picks ONE blog post under 2000 words,
 * calls Ollama (Mistral) to generate ~1000 words of SEO content,
 * updates skills.js, and rebuilds the frontend.
 * 
 * State tracked in /root/cloud-computer-community/scripts/.blog-expansion-state.json
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const SKILLS_FILE = path.join(__dirname, "../frontend/src/data/skills.js");
const STATE_FILE = path.join(__dirname, ".blog-expansion-state.json");
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const TARGET_WORDS = 2000;
const LOCK_FILE = path.join(__dirname, ".blog-expansion.lock");

// Prevent concurrent runs
function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
    if (lockAge < 15 * 60 * 1000) { // 15 min timeout
      console.log("Another expansion is still running. Skipping.");
      process.exit(0);
    }
    fs.unlinkSync(LOCK_FILE); // stale lock
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid));
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch {}
}

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { expanded: [], currentIndex: 0, totalExpanded: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "mistral",
      prompt,
      stream: false,
      options: { temperature: 0.7, num_predict: 2000 }
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
        } catch (e) {
          reject(new Error("Failed to parse Ollama response: " + data.slice(0, 200)));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(300000, () => { req.destroy(); reject(new Error("Ollama timeout")); });
    req.write(body);
    req.end();
  });
}

// Parse skills.js - it exports: const skills = [...]; export default skills;
function parseSkillsFile() {
  const content = fs.readFileSync(SKILLS_FILE, "utf8");
  // Extract the array between "const skills = " and the next ";\n"
  const match = content.match(/const skills = (\[[\s\S]*?\]);\s*\n/);
  if (!match) throw new Error("Could not parse skills array from skills.js");
  
  // Use Function constructor to safely evaluate the array
  const skills = eval("(" + match[1] + ")");
  return { skills, rawContent: content };
}

function writeSkillsFile(skills, rawContent) {
  // Replace the skills array in the file
  const newArray = JSON.stringify(skills, null, 2);
  const updated = rawContent.replace(
    /const skills = \[[\s\S]*?\];\s*\n/,
    `const skills = ${newArray};\n`
  );
  fs.writeFileSync(SKILLS_FILE, updated);
}

async function main() {
  acquireLock();

  try {
    const state = loadState();
    const { skills, rawContent } = parseSkillsFile();

    // Find next skill that needs expansion (under TARGET_WORDS)
    const needsExpansion = skills.filter(s => {
      const words = countWords(s.blogContent || "");
      return words < TARGET_WORDS && !state.expanded.includes(s.slug);
    });

    if (needsExpansion.length === 0) {
      console.log(`All ${skills.length} blogs are at ${TARGET_WORDS}+ words. Done!`);
      releaseLock();
      return;
    }

    const skill = needsExpansion[0];
    const currentWords = countWords(skill.blogContent || "");
    const wordsNeeded = TARGET_WORDS - currentWords;

    console.log(`Expanding: ${skill.title} (${skill.slug})`);
    console.log(`Current: ${currentWords} words, need ${wordsNeeded} more`);
    console.log(`Remaining: ${needsExpansion.length} blogs to expand`);

    // Build prompt for Ollama
    const prompt = `You are an expert SEO content writer. Write approximately ${Math.max(wordsNeeded, 1000)} words of additional content for a blog post about "${skill.title}" in the category "${skill.category}".

The existing blog content is:
${(skill.blogContent || "").slice(0, 1500)}

Write NEW content that expands on this topic. Include:
- Practical step-by-step instructions and tips
- Real-world examples and use cases
- Common mistakes to avoid
- How this relates to running a business or agency
- Benefits of using AI tools like Claude Code for this task
- Industry statistics or best practices where relevant

Format the content with markdown headings (## and ###), bullet points, and short paragraphs. Do NOT repeat content that already exists. Write fresh, unique content that adds value.

Do not include any meta-commentary like "Here is the content" or "I hope this helps". Just write the actual blog content directly.`;

    const newContent = await callOllama(prompt);

    if (!newContent || countWords(newContent) < 200) {
      console.log("Ollama returned insufficient content, skipping this run.");
      releaseLock();
      return;
    }

    // Append new content to existing blogContent
    const skillIndex = skills.findIndex(s => s.slug === skill.slug);
    if (skillIndex === -1) {
      console.log("Could not find skill in array, skipping.");
      releaseLock();
      return;
    }

    skills[skillIndex].blogContent = (skill.blogContent || "") + "\n\n" + newContent.trim();
    const newWordCount = countWords(skills[skillIndex].blogContent);

    console.log(`Expanded to ${newWordCount} words (+${newWordCount - currentWords})`);

    // Write updated skills file
    writeSkillsFile(skills, rawContent);

    // Update state
    state.expanded.push(skill.slug);
    state.currentIndex = state.expanded.length;
    state.totalExpanded = state.expanded.length;
    state.lastExpanded = skill.slug;
    state.lastExpandedAt = new Date().toISOString();
    saveState(state);

    console.log(`Done. ${state.totalExpanded}/${skills.length} blogs expanded so far.`);

    // Rebuild frontend
    console.log("Rebuilding frontend...");
    const { execSync } = require("child_process");
    execSync("cd /root/cloud-computer-community/frontend && npm run build", {
      timeout: 120000,
      stdio: "pipe"
    });

    // Restart frontend container
    execSync("cd /root/cloud-computer-community && docker-compose up -d --build frontend", {
      timeout: 180000,
      stdio: "pipe"
    });

    console.log("Frontend rebuilt and deployed.");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    releaseLock();
  }
}

main();
