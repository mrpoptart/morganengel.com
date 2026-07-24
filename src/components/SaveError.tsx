// Shared save-failure banner for the admin editor pages. Without this a failed
// create/update just spun the button back with nothing on screen, leaving no
// way to tell success from failure. Surfaces the Firebase error code + message.

export function formatSaveError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  return `${e.code ?? "error"}: ${e.message ?? String(error)}`;
}

export function SaveError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert-error text-sm mb-4 font-mono break-all">
      <span>Save failed — {message}</span>
    </div>
  );
}
