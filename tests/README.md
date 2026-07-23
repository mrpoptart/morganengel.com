# Tests

Two tiers, both runnable locally and (later) in CI. Advisory today — nothing
gates deploys yet.

## Unit tests — `npm test`

Plain Vitest, no emulator, instant. Live next to the code as `src/**/*.test.ts`.
Good for pure functions (e.g. `youtubeEmbeds.test.ts` guards the YouTube embed
fix). Watch mode: `npm run test:watch`.

## Integration tests — `npm run test:integration`

Exercise the real Admin-SDK server queries (`src/lib/posts-server.ts`) against
the **Firebase Local Emulator Suite**. The command:

1. starts the Firestore/Auth/Storage emulators under a throwaway `demo-*`
   project (so it can never reach real Firebase),
2. seeds them from `tests/seed.mjs`,
3. runs the Vitest integration suite (`tests/integration/**`),
4. shuts the emulators down.

Requires a JVM (the Firestore/Storage emulators are Java). `firebase-tools` is
invoked via `npx`, so it isn't a project dependency and never touches the
Vercel build.

## The fixture

`tests/seed.mjs` **is** the committed fixture: a small, readable, diffable
dataset (one trip + one journal entry containing a YouTube embed). Grow it as
features need coverage. We seed programmatically rather than committing a binary
emulator export — it diffs cleanly in git and runs identically everywhere.

(The emulator's native `--export-on-exit` also works on a normal machine if you
ever prefer that; it just can't be triggered inside the sandboxed dev
environment, whose proxy blocks the emulator hub's export request.)

## Emulator only

`npm run emulator` starts the suite and leaves it running (e.g. to point a local
`next dev` at it). `npm run emulator:seed` seeds a running emulator.

## Production safety

The only app code that knows about the emulator is a flag-guarded branch in
`src/lib/firebase.ts` and `src/lib/firebase-admin.ts`, active only when
`NEXT_PUBLIC_FIREBASE_EMULATOR=1` / `FIREBASE_EMULATOR=1`. Those are never set on
Vercel, so production behavior is unchanged.
