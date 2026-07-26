// Firestore writes don't reject when the client can't reach the backend — the
// promise just stays pending, so a save can hang forever with no success and no
// error. That leaves the UI spinning silently. Wrapping writes in a timeout
// turns a hang into a real rejection the editor can surface.

export class TimeoutError extends Error {
  constructor(message = "Timed out — the save didn't go through. Check your connection and try again.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
