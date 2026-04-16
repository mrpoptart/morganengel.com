#!/usr/bin/env node

/**
 * Repair posts whose inline <img> tags still reference local/relative Hugo
 * paths (e.g. `../img/sandwich/poboy.jpeg`) because an earlier run of
 * import-hugo.mjs missed them. Walks the `posts` collection, finds any
 * <img src="..."> whose src is not an absolute http(s) URL, uploads the
 * corresponding local file from the Hugo source tree to Firebase Storage,
 * and rewrites the post content in place.
 *
 * Usage:
 *   node scripts/fix-post-images.mjs <source-dir> [--dry-run] [--only=slug]
 *
 * Example:
 *   node scripts/fix-post-images.mjs /Users/me/Downloads/morganengel.com-.../source --dry-run
 *   node scripts/fix-post-images.mjs /Users/me/Downloads/morganengel.com-.../source --only=everything-is-a-sandwich-probably
 *
 * Requires a Firebase service account key at ./service-account-key.json.
 */

import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const SOURCE_DIR = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

if (!SOURCE_DIR || SOURCE_DIR.startsWith("--")) {
  console.error(
    "Usage: node scripts/fix-post-images.mjs <source-dir> [--dry-run] [--only=slug]"
  );
  process.exit(1);
}

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

function guessContentType(path) {
  const p = path.toLowerCase();
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".gif")) return "image/gif";
  if (p.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function uploadImage(localPath) {
  if (!existsSync(localPath)) {
    console.warn(`  ! Image not found: ${localPath}`);
    return null;
  }
  const filename = `images/imported-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${localPath.split("/").pop()}`;
  const file = bucket.file(filename);
  await file.save(readFileSync(localPath), {
    metadata: { contentType: guessContentType(localPath) },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

// Match any <img> src attribute. We'll filter below.
const imgSrcRegex = /<img\b[^>]*?\bsrc="([^"]+)"/g;

// A src needs repair if it points at a Hugo `/img/...` asset (in any form:
// relative `../img/...`, absolute path `/img/...`, or the legacy production
// URL `https://morganengel.com/img/...`). Firebase-hosted URLs and data:
// URIs are already fine.
function needsRepair(src) {
  if (/^data:/i.test(src)) return false;
  if (/storage\.googleapis\.com\//i.test(src)) return false;
  if (/firebasestorage\.googleapis\.com\//i.test(src)) return false;
  return /(^|\/|\\)img\//i.test(src);
}

async function main() {
  const query = ONLY
    ? db.collection("posts").where("slug", "==", ONLY)
    : db.collection("posts");
  const snap = await query.get();

  console.log(
    `Scanning ${snap.size} post(s)${DRY_RUN ? " (DRY RUN)" : ""}${
      ONLY ? ` matching slug=${ONLY}` : ""
    }\n`
  );

  let postsFixed = 0;
  let imagesUploaded = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const original = data.content || "";
    let html = original;

    // Collect unique broken srcs in this post
    const found = new Set();
    imgSrcRegex.lastIndex = 0;
    let m;
    while ((m = imgSrcRegex.exec(original)) !== null) {
      if (needsRepair(m[1])) found.add(m[1]);
    }
    if (found.size === 0) continue;

    console.log(`• ${data.title}  [${data.slug}]`);

    const replacements = new Map();
    for (const src of found) {
      const imgIdx = src.indexOf("img/");
      if (imgIdx < 0) {
        console.warn(`  ? Skipping (no 'img/' segment): ${src}`);
        continue;
      }
      const relPath = src.slice(imgIdx);
      const localPath = join(SOURCE_DIR, relPath);

      if (DRY_RUN) {
        const exists = existsSync(localPath) ? "ok" : "MISSING";
        console.log(`  would upload [${exists}]: ${localPath}   (was ${src})`);
        continue;
      }

      const url = await uploadImage(localPath);
      if (url) {
        replacements.set(src, url);
        imagesUploaded++;
        console.log(`  ✓ ${src}\n      -> ${url}`);
      }
    }

    if (DRY_RUN || replacements.size === 0) continue;

    for (const [oldSrc, newSrc] of replacements) {
      html = html.split(`src="${oldSrc}"`).join(`src="${newSrc}"`);
    }

    await db.doc(`posts/${doc.id}`).update({
      content: html,
      updatedAt: Timestamp.now(),
    });
    postsFixed++;
    console.log(`  saved`);
  }

  console.log(
    `\nDone. Posts updated: ${postsFixed}, images uploaded: ${imagesUploaded}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
