import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({
  credential: cert("/Users/me/Downloads/morganengelcom-firebase-adminsdk-fbsvc-1ec5acb4ea.json"),
});

const db = getFirestore(app);

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function generateExcerpt(html: string, maxLength = 160): string {
  const text = decodeHtmlEntities(html.replace(/<[^>]+>/g, "")).trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

async function main() {
  const snapshot = await db.collection("posts").get();
  console.log(`Found ${snapshot.size} posts`);

  for (const d of snapshot.docs) {
    const data = d.data();
    const newExcerpt = generateExcerpt(data.content || "");
    if (newExcerpt !== data.excerpt) {
      await db.doc(`posts/${d.id}`).update({ excerpt: newExcerpt });
      console.log(`Updated: ${data.title}`);
    } else {
      console.log(`Unchanged: ${data.title}`);
    }
  }

  console.log("Done");
  process.exit(0);
}

main();
