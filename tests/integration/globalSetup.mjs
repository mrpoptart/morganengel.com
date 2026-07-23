// Runs once before the integration suite: seed the (already-running) emulator.
// `firebase emulators:exec` starts the emulators and sets FIRESTORE_EMULATOR_HOST
// before invoking vitest, so by the time this runs the emulator is up.
import { seed } from "../seed.mjs";

export default async function () {
  const counts = await seed();
  console.log(
    `[integration] seeded emulator: ${counts.trips} trip, ${counts.journal} journal entry`
  );
}
