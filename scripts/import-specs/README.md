# Import specs

A **spec** is a small, text-only JSON file describing the posts for one trip:
titles, dates, locations, tags, and the narrative body of each post. It carries
**no image data** — photos are pulled in at build time from a separate
reconstruction HTML file and baked into a generated import file.

This keeps the repo clean: specs are the only thing committed. The big files
(the reconstruction, and the generated import HTML) stay on your machine.

## The pipeline

```
spec.json  +  reconstruction.html          ->  <trip>-import.html   ->  drafts
(committed)   (local, has the photos)           (local, photos baked)     (in the site)

  1. write the spec            2. generate                3. import
                node scripts/build-import-html.mjs           /admin/import-itinerary
                  spec.json reconstruction.html out.html       (pick the file)
```

1. **Write the spec** (this folder). One entry per post.
2. **Generate the import file:**
   ```
   node scripts/build-import-html.mjs \
     scripts/import-specs/<trip>.json \
     /path/to/reconstruction.html \
     <trip>-import.html
   ```
   It prints a per-post `slots / photos` check — every row should say `OK`.
   The output is **dual-purpose**: open it in a browser to proof-read the posts
   with photos, and it's the exact file the importer consumes.
3. **Import:** Admin → Import → *Open the file importer* → pick the generated
   file. Each post is created as a **draft** (never published) with its photos
   re-hosted to storage. Re-running is safe — existing posts are skipped by slug.

## Spec format

```jsonc
{
  "tripSlug": "ireland-2011",   // must match an existing trip's slug to link posts
  "posts": [
    {
      "day": 2,                  // matches "Day N" in the reconstruction file
      "title": "Dublin Down",    // also becomes the slug (dedupe key)
      "dateISO": "2011-10-12T12:00:00Z",  // sorts the post within the trip
      "tags": ["travel", "ireland"],
      "location": {              // map pin; use null if the place is unknown
        "lat": 53.3498,
        "lng": -6.2603,
        "label": "Dublin, Ireland"
      },
      "body": "<p>We landed...{{img}} ...</p><p>...{{img}}{{img}}...</p>",
      "imageOrder": [1, 3, 2]    // optional; see below
    }
  ]
}
```

### `body`

HTML (usually a sequence of `<p>…</p>`). Write the story; drop a `{{img}}`
marker everywhere a photo should appear — typically right before the sentence
or paragraph the photo illustrates, matching the site's inline-image style
(no visible captions; the prose carries it).

The **number of `{{img}}` markers must equal the number of photos** the
reconstruction has for that `day`. The generator checks this and flags any
mismatch.

### `imageOrder` (optional)

By default the markers are filled with the day's photos in the order they appear
in the reconstruction file (photo 1 into the first `{{img}}`, photo 2 into the
second, and so on).

Reconstruction photos are often *mostly* chronological with a few out-of-order
"extra" shots at the end. `imageOrder` is a 1-based list that reorders them so
each lands at the right beat. It must be a permutation whose length equals the
photo count. Example: `[1, 3, 2]` puts photo 3 into the second `{{img}}` and
photo 2 into the third.

To see a day's photos and their order/captions, open the reconstruction file in
a browser, or grep its `figure`/`figcaption` elements.

## Reconstruction file requirements

The generator expects, per day, an element with class `day` containing:

- a `.dnum` whose text includes `Day N` (the number links it to a spec entry), and
- one `<figure><img src="data:image/…;base64,…"></figure>` per photo.

## New trips: checklist

- [ ] Create the trip in the admin first, so its `slug` exists (otherwise posts
      import fine but won't be linked to a trip).
- [ ] Set `tripSlug` in the spec to that slug.
- [ ] One spec entry per post; `{{img}}` count matches each day's photo count.
- [ ] Run the generator; confirm every row is `OK`.
- [ ] Proof-read the generated HTML in a browser.
- [ ] Import; review the drafts; publish when happy.
