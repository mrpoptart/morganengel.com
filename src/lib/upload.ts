import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { withTimeout } from "./withTimeout";

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  // Images are larger than a Firestore write, so allow more time before a hung
  // upload surfaces as a timeout error instead of spinning forever.
  await withTimeout(uploadBytes(storageRef, file), 45000);
  return withTimeout(getDownloadURL(storageRef));
}
