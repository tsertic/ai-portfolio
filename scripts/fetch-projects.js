/**
 * Sanity Project Fetcher
 * Fetches projects from Sanity CMS and merges them into data/content.json
 *
 * Usage:  node scripts/fetch-projects.js
 * Or:     called automatically from generate.js before each generation
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

const SANITY_PROJECT_ID = "pf6wp37f";
const SANITY_DATASET    = "production";
const SANITY_API_VER    = "2021-10-21";

const CONTENT_PATH = path.join(__dirname, "..", "data", "content.json");

// ─── GROQ query ───────────────────────────────────────────────────────────────
// Resolves all references inline. Returns only what the portfolio needs.

const GROQ = `*[_type == "project"] | order(priority asc) {
  title,
  "slug": slug.current,
  "image": mainImage.asset->url,
  "imageAlt": mainImage.alt,
  "technologies": technologies[]->{name, title},
  "categories": categories[]->{title},
  createdAt,
  repository,
  live,
  priority,
  "description": array::join(body[_type=="block"].children[].text, " ")
}`;

// ─── Sanity CDN fetch (no auth needed for public datasets) ───────────────────

function fetchSanity() {
  return new Promise((resolve, reject) => {
    const query   = encodeURIComponent(GROQ);
    const host    = `${SANITY_PROJECT_ID}.api.sanity.io`;
    const urlPath = `/v${SANITY_API_VER}/data/query/${SANITY_DATASET}?query=${query}`;

    https.get({ hostname: host, path: urlPath, headers: { "Accept": "application/json" } }, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`Sanity HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error("Sanity: invalid JSON response")); }
      });
    }).on("error", reject);
  });
}

// ─── Map Sanity result → clean project object ────────────────────────────────

function mapProject(p) {
  return {
    name:        p.title || "Untitled",
    slug:        p.slug  || "",
    description: (p.description || "").trim().slice(0, 400) || null,
    image:       p.image || null,
    imageAlt:    p.imageAlt || p.title || "",
    tech:        (p.technologies || []).map(t => t.name || t.title).filter(Boolean),
    categories:  (p.categories  || []).map(c => c.title).filter(Boolean),
    live:        p.live       || null,
    repository:  p.repository || null,
    createdAt:   p.createdAt  || null,
    priority:    p.priority   ?? 99,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function fetchProjects(silent = false) {
  if (!silent) process.stdout.write("📡 Fetching projects from Sanity... ");

  let result;
  try {
    result = await fetchSanity();
  } catch (err) {
    if (!silent) console.log(`\n⚠️  Sanity fetch failed: ${err.message}`);
    if (!silent) console.log("   Using existing projects from content.json.\n");
    return null; // non-fatal — generator will use existing data
  }

  const raw      = result.result || [];
  const projects = raw.map(mapProject);

  if (!silent) console.log(`${projects.length} project(s) fetched.`);

  // Merge into content.json — only update the projects field
  const content = JSON.parse(fs.readFileSync(CONTENT_PATH, "utf8"));
  content.projects = projects;
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2), "utf8");

  if (!silent) {
    console.log("   Projects saved to data/content.json:");
    for (const p of projects) {
      const tech = p.tech.slice(0, 4).join(", ");
      console.log(`   • [${String(p.priority).padStart(2)}] ${p.name} — ${tech || "(no tech)"}`);
    }
    console.log();
  }

  return projects;
}

if (require.main === module) fetchProjects();

module.exports = { fetchProjects };
