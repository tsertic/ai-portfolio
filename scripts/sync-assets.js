#!/usr/bin/env node

/**
 * Asset Sync — docs/assets/ → docs/history/assets/
 *
 * Strategy: ADDITIVE ONLY — never deletes from history/assets/.
 *
 * Why additive?
 *   History HTML files reference assets/ via relative paths (../assets/...).
 *   Deleting a file from history/assets/ would silently break every past page
 *   that referenced it. New assets are always added; nothing is ever removed.
 *
 * What it does:
 *   • Recursively walks docs/assets/
 *   • For each file: copies it to the mirror path in docs/history/assets/
 *     ONLY if it doesn't exist there yet, OR if it differs (size or mtime).
 *   • Creates missing subdirectories automatically.
 *   • Skips identical files to keep it fast.
 *
 * Usage:
 *   node scripts/sync-assets.js          — runs standalone, prints report
 *   require('./sync-assets').syncAssets() — called programmatically (silent opt)
 */

const fs   = require("fs");
const path = require("path");

const SRC_DIR  = path.join(__dirname, "..", "docs", "assets");
const DEST_DIR = path.join(__dirname, "..", "docs", "history", "assets");

// ─── Core sync ───────────────────────────────────────────────────────────────

function syncAssets(silent = false) {
  if (!fs.existsSync(SRC_DIR)) {
    if (!silent) console.warn("⚠  Source not found:", SRC_DIR);
    return { copied: 0, skipped: 0, errors: 0 };
  }

  const stats = { copied: 0, skipped: 0, errors: 0, files: [] };
  syncDir(SRC_DIR, DEST_DIR, stats);

  if (!silent) {
    console.log("\n🔄 Asset sync — docs/assets/ → docs/history/assets/");
    if (stats.files.length) {
      stats.files.forEach(f => console.log(`   ✚  ${f}`));
    }
    console.log(
      `   Copied: ${stats.copied}  |  Already up-to-date: ${stats.skipped}` +
      (stats.errors ? `  |  Errors: ${stats.errors}` : "")
    );
  }

  return stats;
}

// ─── Recursive directory walker ───────────────────────────────────────────────

function syncDir(srcDir, destDir, stats) {
  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath  = path.join(srcDir,  entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      syncDir(srcPath, destPath, stats);
    } else if (entry.isFile()) {
      try {
        if (needsCopy(srcPath, destPath)) {
          fs.copyFileSync(srcPath, destPath);
          // Preserve source mtime so next run skips unchanged files
          const srcStat = fs.statSync(srcPath);
          fs.utimesSync(destPath, srcStat.atime, srcStat.mtime);
          stats.copied++;
          stats.files.push(path.relative(SRC_DIR, srcPath));
        } else {
          stats.skipped++;
        }
      } catch (err) {
        stats.errors++;
        console.error(`   ✖  Failed to copy ${entry.name}:`, err.message);
      }
    }
  }
}

// ─── Decide whether a copy is needed ─────────────────────────────────────────

function needsCopy(srcPath, destPath) {
  if (!fs.existsSync(destPath)) return true;         // destination missing → copy

  const srcStat  = fs.statSync(srcPath);
  const destStat = fs.statSync(destPath);

  if (srcStat.size !== destStat.size) return true;   // different size → copy

  // mtime comparison with 1-second tolerance (FAT/Windows rounding)
  const delta = Math.abs(srcStat.mtimeMs - destStat.mtimeMs);
  if (delta > 1000) return true;                     // source is newer → copy

  return false;                                      // identical → skip
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

if (require.main === module) syncAssets();

module.exports = { syncAssets };
