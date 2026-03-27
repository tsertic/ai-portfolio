#!/usr/bin/env node

/**
 * AI Portfolio Generator
 * Generates a fresh one-page portfolio HTML file using an AI API.
 * Supports: Claude (Anthropic), GPT-4 (OpenAI), Gemini (Google)
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");
const { pickParams, describeParams } = require("./params");
const { scanAssets }                 = require("./scan-assets");
const { fetchProjects }              = require("./fetch-projects");

// ─── Config ─────────────────────────────────────────────────────────────────

const CONFIG = {
  outputPath:  path.join(__dirname, "..", "docs", "index.html"),
  contentPath: path.join(__dirname, "..", "data", "content.json"),

  // Add more models to any array — all are eligible for random pick
  models: {
  claude: [
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
  ],
  openai: [
    "gpt-5.2",
    "gpt-5-mini",
    "gpt-5-nano",
  ],
  gemini: [
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
  ],}
};

// ─── Load .env ───────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── Provider / LLM picker ───────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveProvider() {
  const useRandom = (process.env.USE_RANDOM_LLM || "false").toLowerCase() === "true";

  if (useRandom) {
    const available = [];
    if (process.env.ANTHROPIC_API_KEY) available.push("claude");
    if (process.env.OPENAI_API_KEY)    available.push("openai");
    if (process.env.GEMINI_API_KEY)    available.push("gemini");

    if (available.length > 1) {
      const chosen = pickRandom(available);
      console.log(`   LLM:      ${chosen} (random from: ${available.join(", ")})`);
      return chosen;
    }
  }

  return process.env.AI_PROVIDER || "claude";
}

function resolveModel(provider) {
  // AI_MODEL env overrides everything
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  const list = CONFIG.models[provider];
  return Array.isArray(list) ? pickRandom(list) : list;
}

function getApiKey(provider) {
  const keys = {
    claude: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  return keys[provider] || "";
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(content, date, params, assets) {
  const seed = date.toISOString().slice(0, 10);

  // Format asset list for the prompt — compact, one line each
  const assetBlock = assets && assets.length > 0
    ? assets.map(a =>
        `  • "${a.path}"  [${a.type}${a.size_kb ? ", " + a.size_kb + " KB" : ""}]  — ${a.description}`
      ).join("\n")
    : "  (no assets found)";

  return `You are an expert web developer and creative designer. Generate a complete one-page portfolio as a SINGLE self-contained HTML file.

═══ TODAY'S DESIGN PARAMETERS (${seed}) ═══
${describeParams(params)}

═══ AVAILABLE ASSETS ═══
All paths below are relative to the HTML file (docs/). Use them directly in src="" or url().
${assetBlock}

═══ WRITING STYLE INSTRUCTION ═══
You have a current text tone: "${params.text_tone || "your choice"}".
The portfolio data below contains raw facts, not final copy.
YOUR JOB: write all visible text in your own voice matching that tone.
- About/bio section: write it fresh from the professional_facts — never copy-paste. Make it feel like a human wrote it today. Different length, different angle, different emphasis each time.
- Projects section: you may rephrase project descriptions to be shorter and punchier — but keep all factual details accurate.
- All other labels, section titles, CTAs, taglines: write them to match the tone. "Get in touch" might become "Let's talk." or "Drop me a line." or "I don't bite." — whatever fits.
- The self-generating section tagline especially should feel freshly written, not templated.

═══ PORTFOLIO CONTENT (raw data — rewrite text, keep facts) ═══
${JSON.stringify(content, null, 2)}

═══ OUTPUT RULES ═══
- Output ONLY raw HTML starting with <!DOCTYPE html> and ending with </html>
- No markdown, no code fences, no explanations whatsoever
- CSS max ~200 lines — concise, use shorthand, combine selectors
- 1 Google Fonts CDN link only (pick a font that matches the typography parameter)
- Mobile responsive (1-2 media queries)
- ALL content must be fully visible immediately — NO opacity:0, NO fade-in classes, NO IntersectionObserver on content

═══ REQUIRED SECTIONS ═══
1. Nav — ${params.nav_style ? `Style: ${params.nav_style}.` : "name/logo + anchor links."} Keep it functional and themed.
2. Hero — ${params.use_portrait ? 'Use the portrait image (see AVAILABLE ASSETS above for the exact path)' + (params.image_treatment ? ` styled with: ${params.image_treatment}.` : ' styled to match the theme (circle, hex, or styled border).') + ' If image fails to load, show a styled "TS" initials fallback.' : 'NO portrait photo — use a styled geometric "TS" monogram or abstract avatar instead.'} Name, title, tagline, GitHub + LinkedIn + email buttons.${params.hero_cta_style ? ` Button style: ${params.hero_cta_style}.` : ''}
3. About — bio text (use content.about) + skills (${params.skills_display ? `display as: ${params.skills_display}` : "displayed as tags/pills"}). Optionally, if it fits the tone naturally, you can add a subtle human touch — he has a daughter named Anja and a dog named Eevee. This is NOT required and should never be the focus — just a quiet detail if the design has room for it.
4. Projects — ${params.card_style ? `card style: ${params.card_style}.` : 'cards with'} title, description, tech stack tags, live/github links. Each project has an image URL in the data (field: "image") — use it as the card's visual if the card style supports imagery. Show a maximum of 6 projects, pick the most interesting ones (lowest priority number = most important). IMPORTANT: always include a small note/label near the projects section explaining that these are hobby projects, side work, client websites, scripts, and experiments — his professional work is enterprise software for international clients (Saudi Aramco, ESA, THT) which is separate. This note should be styled tastefully, not a wall of text — e.g. a small italic caption or a subtle intro line.
5. Contact — ${params.contact_style ? `style: ${params.contact_style}.` : 'email + social links'}
6. Footer — ${params.footer_style ? params.footer_style : 'minimal one-line'}
7. **SELF-GENERATING SECTION** ← THIS IS REQUIRED AND MUST BE CLEARLY VISIBLE.
   This is a unique portfolio — it is fully regenerated every day by AI with a brand new design.
   This section must:
   - Be its own visually distinct section or a prominent banner (NOT hidden in a tiny footer note)
   - Include a short punchy quote or tagline about the concept — something like:
     "Every day, AI wakes up and redesigns this portfolio from scratch." or
     "No two days look the same. This portfolio regenerates every 24 hours." or
     "Built by a developer. Redesigned daily by AI." — pick or invent something clever that fits the ${params.text_tone || "overall"} tone.
   - Include the generation date: ${date.toISOString().slice(0,10)}
   - Include a clearly styled link/button to "history/" (relative path, NO leading slash) with label like "Browse all past versions →" or "See the archive →"
   - Style it to feel like a feature, not a footnote — use the theme's personality

═══ HERO SECTION DETAIL ═══
The hero is the first impression — make it count.
${params.hero_layout ? `- Layout: ${params.hero_layout}` : "- Layout: your creative choice"}
${params.hero_headline_scale ? `- Headline scale: ${params.hero_headline_scale}` : "- Headline scale: your choice — match the creativity level"}
${params.hero_background ? `- Background: ${params.hero_background}` : "- Background: your choice — complement the theme"}
${params.hero_height ? `- Height: ${params.hero_height}` : "- Height: your choice"}

═══ VISUAL DECORATION ═══
- Decoration level: ${params.decoration}
- Add decorative background SVG shapes/blobs (position: fixed or absolute, opacity 0.05–0.12, z-index: -1)
- On scroll: use ~10 lines of JS with requestAnimationFrame + scrollY to slowly rotate/drift those background shapes — decorative only, NEVER affects content elements
- Keep ALL content z-index above decorations
${params.section_divider ? `- Section dividers: ${params.section_divider}` : ""}

═══ INTERACTION & POLISH ═══
${params.scroll_animation ? `- Scroll animation: ${params.scroll_animation}` : "- Scroll animation: keep subtle or skip entirely"}
${params.hover_effects ? `- Hover effects: ${params.hover_effects}` : "- Hover effects: your choice, keep lightweight"}
${params.cursor_effect ? `- Cursor effect: ${params.cursor_effect} (lightweight, max 10 lines JS)` : ""}
${params.border_radius ? `- Border radius: ${params.border_radius}` : ""}
${params.spacing_density ? `- Spacing: ${params.spacing_density}` : ""}

═══ CREATIVITY GUIDANCE ═══
Creativity is ${params.creativity}/100. ${params.creativity <= 20 ? "Keep it clean, professional, restrained." : params.creativity <= 50 ? "Professional with clear personality." : params.creativity <= 75 ? "Be bold and expressive — break some conventions." : "Go wild — unconventional layout, unexpected choices, make it memorable."}
${params.quirk ? `\nSPECIAL CONSTRAINT: ${params.quirk}` : ""}
${params.bonus_quirk ? `BONUS CONSTRAINT: ${params.bonus_quirk}` : ""}

IMPORTANT: Total file must fit in one response. CSS concise, scroll JS under 30 lines total.`;
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function httpsPost(hostname, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path: urlPath, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers } },
      (res) => {
        let raw = "";
        res.on("data", c => raw += c);
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpsPostStream(hostname, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path: urlPath, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers } },
      (res) => {
        if (res.statusCode !== 200) {
          let raw = "";
          res.on("data", c => raw += c);
          res.on("end", () => reject(new Error(`HTTP ${res.statusCode}: ${raw}`)));
          return;
        }
        let fullText = "", buffer = "";
        res.on("data", chunk => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const s = line.slice(6).trim();
            if (s === "[DONE]") continue;
            try {
              const evt = JSON.parse(s);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta")
                fullText += evt.delta.text;
            } catch { /* skip */ }
          }
        });
        res.on("end", () => resolve(fullText));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ─── API callers ─────────────────────────────────────────────────────────────

async function callClaude(prompt, apiKey, model) {
  console.log(`  Model: ${model} (streaming)`);
  const text = await httpsPostStream(
    "api.anthropic.com", "/v1/messages",
    { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    { model, max_tokens: 16000, stream: true, messages: [{ role: "user", content: prompt }] }
  );
  if (!text) throw new Error("Claude returned empty response");
  return text;
}

async function callOpenAI(prompt, apiKey, model) {
  console.log(`  Model: ${model}`);
  const res = await httpsPost(
    "api.openai.com", "/v1/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
    { model, max_tokens: 16000, messages: [{ role: "user", content: prompt }] }
  );
  if (res.status !== 200) throw new Error(`OpenAI error ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body.choices[0].message.content;
}

async function callGemini(prompt, apiKey, model) {
  console.log(`  Model: ${model}`);
  const res = await httpsPost(
    "generativelanguage.googleapis.com",
    `/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {},
    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 16000 } }
  );
  if (res.status !== 200) throw new Error(`Gemini error ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body.candidates[0].content.parts[0].text;
}

// ─── HTML post-processor ─────────────────────────────────────────────────────

function processHTML(raw) {
  let html = raw.trim();

  // Strip markdown fences if AI added them
  if (html.startsWith("```")) {
    html = html.replace(/^```[^\n]*\n/, "").replace(/\n```\s*$/, "").trim();
  }
  const idx = html.toLowerCase().indexOf("<!doctype html>");
  if (idx > 0) html = html.slice(idx);

  // ── Truncation recovery ──────────────────────────────────────────────────
  // If the AI hit the token limit and output is cut off, close open tags gracefully
  const lower = html.toLowerCase();
  if (!lower.includes("</html>")) {
    console.warn("   ⚠️  HTML appears truncated — auto-closing tags");
    if (!lower.includes("</body>")) html += "\n</body>";
    html += "\n</html>";
  }

  // Safety: force all animation classes visible (override any AI-generated opacity:0)
  const visibilityOverride = `<style id="safety-override">
*[class*="fade"],*[class*="anim"],*[class*="hidden"],*[class*="reveal"],*[class*="slide"] {
  opacity: 1 !important; transform: none !important;
  visibility: visible !important; animation: none !important;
}
</style>`;
  html = html.replace("</head>", visibilityOverride + "\n</head>");

  // Fix absolute /history/ links → relative history/ (needed for GitHub Pages subpath)
  html = html.replace(/href="\/history\/"/g, 'href="history/"');
  html = html.replace(/href='\/history\/'/g, "href='history/'");

  return html;
}

// Make a history-safe copy: fix asset paths relative to /history/ subfolder
function makeHistoryCopy(html) {
  // History pages live at docs/history/TIMESTAMP.html
  // Main assets are at docs/assets/... → history needs ../assets/...
  // Both the old ("images/") and new ("assets/images/") paths are handled.
  return html
    // old-style bare path (shouldn't appear anymore but kept as safety net)
    .replace(/src="images\//g,   'src="../assets/images/')
    .replace(/src='images\//g,   "src='../assets/images/")
    .replace(/url\(images\//g,   'url(../assets/images/')
    .replace(/href="images\//g,  'href="../assets/images/')
    // new-style assets/ path — just prepend ../
    .replace(/src="assets\//g,   'src="../assets/')
    .replace(/src='assets\//g,   "src='../assets/")
    .replace(/url\(assets\//g,   'url(../assets/')
    .replace(/href="assets\//g,  'href="../assets/')
    // fix /history/ link inside history copies → root
    .replace(/href="\/history\/"/g, 'href="../history/"');
}

// ─── History gallery builder ─────────────────────────────────────────────────

function buildHistoryGallery(historyDir) {
  const files = fs.readdirSync(historyDir)
    .filter(f => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.html$/.test(f))
    .sort().reverse(); // newest first

  const nowStr = new Date().toISOString().slice(0, 10);

  const cards = files.map(file => {
    const stem    = file.replace(".html", ""); // e.g. 2026-03-24_14-05-30
    const jsonFile = path.join(historyDir, stem + ".json");
    const params  = fs.existsSync(jsonFile)
      ? JSON.parse(fs.readFileSync(jsonFile, "utf8"))
      : null;

    // Parse timestamp from filename
    const [datePart, timePart] = stem.split("_");
    const [hh, mm, ss] = timePart.split("-");
    const dateObj = new Date(`${datePart}T${hh}:${mm}:${ss}Z`);
    const isToday = datePart === nowStr;

    const dateLabel = dateObj.toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const timeLabel = `${hh}:${mm}:${ss} UTC`;

    // Build param tags from sidecar JSON
    const paramTags = params ? buildParamTags(params) : "";

    return `
    <div class="card">
      <div class="preview-wrap">
        <iframe src="${file}" loading="lazy" scrolling="no" tabindex="-1"></iframe>
        <a class="overlay-link" href="${file}" target="_blank" title="Open full page"></a>
        <div class="creativity-badge" title="Creativity level">${params ? params.creativity : "?"}<span>/100</span></div>
      </div>
      <div class="card-info">
        <div class="card-header">
          <div>
            <div class="date-label">${dateLabel}</div>
            <div class="time-label">Generated at ${timeLabel}${params ? ` · via ${params.provider || "claude"}` : ""}</div>
          </div>
          <div class="card-actions">
            ${isToday ? '<span class="badge">Latest</span>' : ''}
            <a class="view-btn" href="${file}" target="_blank">View →</a>
          </div>
        </div>
        ${paramTags ? `<div class="param-tags">${paramTags}</div>` : ""}
      </div>
    </div>`;
  }).join("\n");

  const gallery = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portfolio History — Tomislav Sertic</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0a0c14;color:#e2e8f0;min-height:100vh;padding:48px 24px}
  .page-header{max-width:1200px;margin:0 auto 48px}
  h1{font-size:2.2rem;font-weight:800;margin-bottom:8px;letter-spacing:-.02em}
  h1 span{background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .subtitle{color:#64748b;font-size:.95rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;max-width:1200px;margin:0 auto}
  .card{background:#111827;border-radius:14px;overflow:hidden;border:1px solid #1f2937;transition:transform .2s,border-color .2s,box-shadow .2s}
  .card:hover{transform:translateY(-3px);border-color:#3b82f6;box-shadow:0 8px 30px rgba(59,130,246,.15)}
  .preview-wrap{position:relative;width:100%;height:200px;overflow:hidden;background:#0a0c14}
  .preview-wrap iframe{width:1280px;height:860px;border:none;transform:scale(.234);transform-origin:top left;pointer-events:none;display:block}
  .overlay-link{position:absolute;inset:0;z-index:2}
  .creativity-badge{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);color:#f8fafc;font-size:.8rem;font-weight:700;padding:4px 9px;border-radius:100px;z-index:3;border:1px solid rgba(255,255,255,.1)}
  .creativity-badge span{font-size:.65rem;opacity:.7}
  .card-info{padding:14px 16px 16px}
  .card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
  .card-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .date-label{font-size:.87rem;color:#cbd5e1;font-weight:500}
  .time-label{font-size:.75rem;color:#475569;margin-top:2px}
  .badge{background:#1d4ed8;color:#fff;font-size:.68rem;padding:2px 9px;border-radius:100px;font-weight:600;white-space:nowrap}
  .view-btn{color:#60a5fa;font-size:.82rem;text-decoration:none;font-weight:600;white-space:nowrap}
  .view-btn:hover{color:#93c5fd}
  .param-tags{display:flex;flex-wrap:wrap;gap:5px}
  .tag{font-size:.7rem;padding:2px 8px;border-radius:6px;white-space:nowrap;border:1px solid transparent}
  .tag-theme{background:#1e3a5f;color:#93c5fd;border-color:#1e40af}
  .tag-tone{background:#1e3a2f;color:#86efac;border-color:#166534}
  .tag-layout{background:#2d1f3e;color:#c4b5fd;border-color:#5b21b6}
  .tag-mood{background:#3b2d1f;color:#fdba74;border-color:#9a3412}
  .tag-quirk{background:#2d1f1f;color:#fca5a5;border-color:#7f1d1d}
  .tag-misc{background:#1f2937;color:#9ca3af;border-color:#374151}
  .empty{color:#374151;text-align:center;padding:80px 20px;font-size:1.1rem}
  a.back{display:inline-flex;align-items:center;gap:6px;color:#60a5fa;text-decoration:none;font-size:.88rem;margin-bottom:36px;opacity:.8}
  a.back:hover{opacity:1}
</style>
</head>
<body>
<div class="page-header">
  <a class="back" href="../">← Back to current portfolio</a>
  <h1>Portfolio <span>History</span></h1>
  <p class="subtitle">${files.length} version${files.length !== 1 ? "s" : ""} generated — a new AI design every day</p>
</div>
${files.length > 0
  ? `<div class="grid">${cards}</div>`
  : '<p class="empty">No history yet. Run the generator to create the first version.</p>'}
</body>
</html>`;

  fs.writeFileSync(path.join(historyDir, "index.html"), gallery, "utf8");
  console.log(`   Gallery: docs/history/index.html (${files.length} version${files.length !== 1 ? "s" : ""})`);
}

// Build coloured param tags for gallery card
function buildParamTags(p) {
  const tags = [];
  const t = (text, cls) => `<span class="tag ${cls}">${text}</span>`;

  if (p.theme)         tags.push(t(`🎨 ${p.theme}`, "tag-theme"));
  if (p.text_tone)     tags.push(t(`🗣 ${p.text_tone}`, "tag-tone"));
  if (p.layout)        tags.push(t(`📐 ${p.layout}`, "tag-layout"));
  if (p.color_mood)    tags.push(t(`🌈 ${p.color_mood}`, "tag-mood"));
  if (p.color_scheme)  tags.push(t(p.color_scheme, "tag-misc"));
  if (p.typography)    tags.push(t(`✍ ${p.typography}`, "tag-misc"));
  if (p.hero_layout)   tags.push(t(`hero: ${p.hero_layout}`, "tag-misc"));
  if (p.card_style)    tags.push(t(`cards: ${p.card_style}`, "tag-misc"));
  if (p.quirk)         tags.push(t(`⚡ ${p.quirk}`, "tag-quirk"));
  if (p.bonus_quirk)   tags.push(t(`✨ ${p.bonus_quirk}`, "tag-quirk"));
  if (p.use_portrait !== undefined) tags.push(t(p.use_portrait ? "📷 portrait" : "🔤 initials", "tag-misc"));

  return tags.join("");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const provider = resolveProvider();
  const model    = resolveModel(provider);
  const apiKey   = getApiKey(provider);

  if (!apiKey) {
    console.error(`\n❌ No API key for provider "${provider}".`);
    console.error(`   Set ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY in .env\n`);
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(CONFIG.contentPath, "utf8"));
  const date    = new Date();
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD

  // Timestamp slug: YYYY-MM-DD_HH-MM-SS (used as unique history filename)
  const ts = date.toISOString()
    .replace("T", "_")
    .replace(/:/g, "-")
    .slice(0, 19); // e.g. 2026-03-24_14-05-30

  const params  = pickParams();
  // Attach metadata to params so sidecar JSON is self-contained
  params._ts       = ts;
  params._date     = dateStr;
  params._provider = provider;
  params._model    = model;

  console.log(`\n🚀 AI Portfolio Generator`);
  console.log(`   Date:       ${dateStr}`);
  console.log(`   Provider:   ${provider}`);
  console.log(`   Creativity: ${params.creativity}/100`);
  console.log(`   Theme:      ${params.theme || "(AI decides)"}`);
  console.log(`   Tone:       ${params.text_tone || "(AI decides)"}`);
  console.log(`   Layout:     ${params.layout || "(AI decides)"}`);
  console.log(`   Colors:     ${params.color_mood || "(AI decides)"}`);
  console.log(`   Scheme:     ${params.color_scheme || "(AI decides)"}`);
  console.log(`   Hero:       ${params.hero_layout || "(AI decides)"}`);
  console.log(`   Hero BG:    ${params.hero_background || "(AI decides)"}`);
  console.log(`   Nav:        ${params.nav_style || "(AI decides)"}`);
  console.log(`   Cards:      ${params.card_style || "(AI decides)"}`);
  console.log(`   Portrait:   ${params.use_portrait ? "yes" : "no"}`);
  console.log(`   Img style:  ${params.image_treatment || "(AI decides)"}`);
  console.log(`   Spacing:    ${params.spacing_density || "(AI decides)"}`);
  if (params.quirk)       console.log(`   Quirk:      ${params.quirk}`);
  if (params.bonus_quirk) console.log(`   Bonus:      ${params.bonus_quirk}`);

  // Fetch fresh projects from Sanity (non-fatal if offline)
  process.stdout.write(`\n📡 Fetching projects from Sanity... `);
  await fetchProjects(true);
  // Reload content.json after Sanity update
  const freshContent = JSON.parse(fs.readFileSync(CONFIG.contentPath, "utf8"));
  console.log(`${freshContent.projects.length} projects loaded.`);

  // Scan assets — runs silently, updates data/assets.json
  const assets = scanAssets(true);
  console.log(`📦 Assets: ${assets.length} file(s) in docs/assets/`);

  const prompt = buildPrompt(freshContent, date, params, assets);

  console.log(`\n⏳ Calling AI API...`);

  let rawOutput;
  try {
    if (provider === "claude")       rawOutput = await callClaude(prompt, apiKey, model);
    else if (provider === "openai")  rawOutput = await callOpenAI(prompt, apiKey, model);
    else if (provider === "gemini")  rawOutput = await callGemini(prompt, apiKey, model);
    else throw new Error(`Unknown provider: "${provider}"`);
  } catch (err) {
    console.error(`\n❌ API call failed: ${err.message}\n`);
    process.exit(1);
  }

  const html = processHTML(rawOutput);

  if (!html.toLowerCase().includes("<!doctype html>")) {
    console.error("\n❌ AI did not return valid HTML. Saved raw output to docs/debug.txt");
    fs.writeFileSync(path.join(__dirname, "..", "docs", "debug.txt"), rawOutput);
    process.exit(1);
  }

  // Write main portfolio
  fs.writeFileSync(CONFIG.outputPath, html, "utf8");

  // ── Save history copy ──────────────────────────────────────────────────────
  const historyDir = path.join(__dirname, "..", "docs", "history");
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  const historyHtml = makeHistoryCopy(html);
  const historyBase = path.join(historyDir, ts);          // e.g. .../2026-03-24_14-05-30

  // HTML copy with corrected asset paths
  fs.writeFileSync(`${historyBase}.html`, historyHtml, "utf8");

  // Params sidecar JSON (used by gallery to show tags + metadata)
  fs.writeFileSync(`${historyBase}.json`, JSON.stringify(params, null, 2), "utf8");

  // ── Rebuild gallery ────────────────────────────────────────────────────────
  buildHistoryGallery(historyDir);

  const sizeKB = (fs.statSync(CONFIG.outputPath).size / 1024).toFixed(1);
  console.log(`\n✅ Done!`);
  console.log(`   docs/index.html              (${sizeKB} KB)`);
  console.log(`   docs/history/${ts}.html`);
  console.log(`   docs/history/${ts}.json`);
  console.log(`   docs/history/index.html\n`);
}

main();
