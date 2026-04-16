#!/usr/bin/env node

/**
 * Import Hugo posts into Firebase Firestore.
 *
 * Usage:
 *   node scripts/import-hugo.mjs <source-dir> [--dry-run]
 *
 * Example:
 *   node scripts/import-hugo.mjs /Users/me/Downloads/morganengel.com-.../source --dry-run
 *   node scripts/import-hugo.mjs /Users/me/Downloads/morganengel.com-.../source
 *
 * Requires a Firebase service account key at ./service-account-key.json
 * (Download from Firebase Console > Project Settings > Service Accounts)
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import matter from "gray-matter";
import { marked } from "marked";

// --- Config ---
const SOURCE_DIR = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = process.argv.find((a) => a.startsWith("--limit="));
const POST_LIMIT = LIMIT ? parseInt(LIMIT.split("=")[1]) : Infinity;
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

if (!SOURCE_DIR) {
  console.error("Usage: node scripts/import-hugo.mjs <source-dir> [--dry-run]");
  process.exit(1);
}

const postsDir = join(SOURCE_DIR, "_posts");
const imgDir = join(SOURCE_DIR, "img");

if (!existsSync(postsDir)) {
  console.error(`Posts directory not found: ${postsDir}`);
  process.exit(1);
}

// --- Firebase Admin init ---
const keyPath = resolve("service-account-key.json");
if (!existsSync(keyPath)) {
  console.error(`Service account key not found at ${keyPath}`);
  console.error(
    "Download from Firebase Console > Project Settings > Service Accounts > Generate New Private Key"
  );
  process.exit(1);
}

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync(keyPath, "utf8"))),
  storageBucket: "morganengelcom.firebasestorage.app",
});

const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// --- Helpers ---
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateExcerpt(html, maxLength = 160) {
  const text = html.replace(/<[^>]+>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

// Upload a local image to Firebase Storage and return its public URL
async function uploadImage(localPath) {
  if (!existsSync(localPath)) {
    console.warn(`  Image not found: ${localPath}`);
    return null;
  }

  const filename = `images/imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${localPath.split("/").pop()}`;
  const file = bucket.file(filename);

  await file.save(readFileSync(localPath), {
    metadata: { contentType: guessContentType(localPath) },
  });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

function guessContentType(path) {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

// --- Main ---
async function importPosts() {
  const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} posts to import${DRY_RUN ? " (DRY RUN)" : ""}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const filtered = ONLY ? files.filter((f) => f.includes(ONLY)) : files.slice(0, POST_LIMIT);
  for (const file of filtered) {
    try {
      const raw = readFileSync(join(postsDir, file), "utf8");
      const { data: frontmatter, content: mdContent } = matter(raw);

      const title = frontmatter.title || file.replace(/\.md$/, "").replace(/-/g, " ");
      const slug = slugify(title);

      // Parse date
      let publishedAt;
      if (frontmatter.date) {
        publishedAt = new Date(frontmatter.date);
        if (isNaN(publishedAt.getTime())) {
          console.warn(`  Bad date for "${title}", using now`);
          publishedAt = new Date();
        }
      } else {
        publishedAt = new Date();
      }

      // Strip Hugo <!-- more --> excerpt marker
      const cleanMd = mdContent.replace(/<!--\s*more\s*-->/g, "");

      // Convert markdown to HTML
      let html = await marked(cleanMd);

      // Parse tags
      const tags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags.map((t) => String(t).toLowerCase()).filter(Boolean)
        : [];

      // Handle cover image (photos field — can be a string or array)
      let coverImage = null;
      const photoValue = Array.isArray(frontmatter.photos)
        ? frontmatter.photos[0]
        : frontmatter.photos;
      if (photoValue) {
        const photoPath = String(photoValue).startsWith("/")
          ? String(photoValue).slice(1)
          : String(photoValue);
        const localImgPath = join(SOURCE_DIR, photoPath);

        if (DRY_RUN) {
          coverImage = `[would upload: ${localImgPath}]`;
        } else {
          coverImage = await uploadImage(localImgPath);
        }
      }

      // Find and upload inline images. Hugo markdown in this repo mixes
      // relative (`../img/...`, `./img/...`), absolute path (`/img/...`),
      // bare (`img/...`), and legacy production-URL (`https://morganengel.com/img/...`)
      // forms — all of them point at the same local `source/img/` tree and
      // need to be swapped for Firebase Storage URLs.
      const imgRegex = /<img\b[^>]*?\bsrc="([^"]+)"/g;
      const inlineSrcs = [];
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1];
        // Skip Firebase-hosted and data: URIs — already fine.
        if (/^data:/i.test(src)) continue;
        if (/(storage|firebasestorage)\.googleapis\.com\//i.test(src)) continue;
        // Only rewrite srcs that reference a local `img/` asset.
        if (!/(^|\/)img\//i.test(src)) continue;
        inlineSrcs.push(src);
      }

      // Collect first, then replace — mutating `html` during exec() with a
      // global regex causes lastIndex to drift and miss matches.
      for (const src of inlineSrcs) {
        // Normalize by slicing from the first "img/" occurrence so that
        // "../img/sandwich/x.jpg" resolves under SOURCE_DIR/img/sandwich/x.jpg.
        const relPath = src.slice(src.indexOf("img/"));
        const localPath = join(SOURCE_DIR, relPath);

        if (DRY_RUN) {
          console.log(`  Would upload inline image: ${localPath}`);
        } else {
          const url = await uploadImage(localPath);
          if (url) {
            html = html.split(src).join(url);
          }
        }
      }

      const postData = {
        title,
        slug,
        content: html,
        excerpt: generateExcerpt(html),
        tags,
        status: "published",
        publishedAt: Timestamp.fromDate(publishedAt),
        createdAt: Timestamp.fromDate(publishedAt),
        updatedAt: Timestamp.now(),
        ...(coverImage ? { coverImage } : {}),
      };

      if (DRY_RUN) {
        console.log(`✓ ${title}`);
        console.log(`  slug: ${slug}`);
        console.log(`  date: ${publishedAt.toISOString()}`);
        console.log(`  tags: ${tags.length ? tags.join(", ") : "(none)"}`);
        console.log(`  cover: ${coverImage || "(none)"}`);
        console.log(`  excerpt: ${postData.excerpt.slice(0, 80)}...`);
        console.log();
      } else {
        // Check for existing post with same slug
        const existing = await db
          .collection("posts")
          .where("slug", "==", slug)
          .limit(1)
          .get();

        if (!existing.empty) {
          console.log(`⏭ Skipping "${title}" — slug already exists`);
          skipped++;
          continue;
        }

        await db.collection("posts").add(postData);
        console.log(`✓ Imported: ${title}`);
      }

      imported++;
    } catch (err) {
      console.error(`✗ Error importing ${file}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(0);
}

importPosts();
