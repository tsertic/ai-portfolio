/**
 * Asset Scanner
 * Scans docs/assets/ and generates data/assets.json
 * This manifest is fed to the AI so it knows what files are available.
 *
 * Usage:  node scripts/scan-assets.js
 * Or:     called automatically from generate.js before each generation
 */

const fs   = require("fs");
const path = require("path");

const ASSETS_DIR = path.join(__dirname, "..", "docs", "assets");
const OUTPUT     = path.join(__dirname, "..", "data", "assets.json");

// ─── File type map ────────────────────────────────────────────────────────────

const TYPE_MAP = {
  webp: "image", jpg: "image", jpeg: "image",
  png:  "image", gif: "image", avif: "image",
  svg:  "vector-image",
  mp4:  "video",  webm: "video",
  mp3:  "audio",  ogg: "audio",
  pdf:  "document",
  woff: "font",   woff2: "font", ttf: "font",
  json: "data",   csv: "data",
};

// ─── Folder-level context hints ───────────────────────────────────────────────

const FOLDER_CONTEXT = {
  images:      "General images",
  photos:      "Photos",
  icons:       "Icons / UI symbols",
  logos:       "Logo variants",
  backgrounds: "Background images / textures",
  projects:    "Project screenshots or visuals",
  avatars:     "Avatar / profile photos",
  thumbnails:  "Thumbnails",
  svg:         "SVG illustrations or icons",
  fonts:       "Custom web fonts",
  videos:      "Video files",
  documents:   "Documents / PDFs",
};

// ─── Per-filename descriptions (exact match overrides) ───────────────────────

const KNOWN_FILES = {
  "portrait.webp": "Portrait photo of Tomislav Sertic — the portfolio owner. Use for hero/about sections.",
  "portrait.jpg":  "Portrait photo of Tomislav Sertic — the portfolio owner.",
  "portrait.png":  "Portrait photo of Tomislav Sertic — the portfolio owner.",
  "avatar.webp":   "Profile avatar image of Tomislav Sertic.",
  "logo.svg":      "Personal logo / wordmark.",
  "logo.png":      "Personal logo / wordmark.",
  "cv.pdf":        "Curriculum Vitae / Resume PDF.",
  "resume.pdf":    "Curriculum Vitae / Resume PDF.",
};

// ─── Description inference ────────────────────────────────────────────────────

function inferDescription(filename, folderPath) {
  // Exact match first
  if (KNOWN_FILES[filename.toLowerCase()]) return KNOWN_FILES[filename.toLowerCase()];

  const ext      = path.extname(filename).slice(1).toLowerCase();
  const nameBase = path.basename(filename, "." + ext);
  const folders  = folderPath.split("/").filter(Boolean);
  const leafFolder = folders[folders.length - 1] || "";

  // Human-readable name: replace separators, capitalise words
  const readableName = nameBase
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → words
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

  const typeLabel  = TYPE_MAP[ext]    || "file";
  const folderHint = FOLDER_CONTEXT[leafFolder] || null;

  if (folderHint) return `${folderHint} — ${readableName}`;
  return `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}: ${readableName}`;
}

// ─── Recursive directory scan ─────────────────────────────────────────────────

function scanDir(dir, docsDir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, docsDir, results);
    } else if (entry.isFile()) {
      const relFromDocs   = path.relative(docsDir, fullPath).replace(/\\/g, "/");
      const relFromAssets = path.relative(ASSETS_DIR, fullPath).replace(/\\/g, "/");
      const folderPath    = path.dirname(relFromAssets).replace(/\\/g, "/");
      const ext           = path.extname(entry.name).slice(1).toLowerCase();
      const stats         = fs.statSync(fullPath);

      results.push({
        file:        entry.name,
        path:        relFromDocs,          // use this in HTML: src="assets/images/portrait.webp"
        folder:      folderPath === "." ? "(root)" : folderPath,
        type:        TYPE_MAP[ext] || "file",
        ext,
        size_kb:     Math.round(stats.size / 1024 * 10) / 10,
        description: inferDescription(entry.name, folderPath),
      });
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function scanAssets(silent = false) {
  const docsDir = path.join(__dirname, "..", "docs");
  const assets  = scanDir(ASSETS_DIR, docsDir);

  // Ensure data/ directory exists
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(OUTPUT, JSON.stringify(assets, null, 2), "utf8");

  if (!silent) {
    console.log(`\n📦 Asset scanner — found ${assets.length} file(s):`);
    for (const a of assets) {
      console.log(`   [${a.type.padEnd(14)}] ${a.path.padEnd(40)} — ${a.description}`);
    }
    console.log(`\n   Saved → data/assets.json\n`);
  }

  return assets;
}

// Run directly if called as a script
if (require.main === module) scanAssets();

module.exports = { scanAssets };
