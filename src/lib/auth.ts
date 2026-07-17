// Allowed admin UIDs — these users can access /admin and write content.
export const ADMIN_UIDS = [
  "5amaiuG38XMkaGRoYJoDA95stfG2", // Morgan
  "wP0SddrHeNRZIBrgpynNKuy8M7C3", // second author
];

export function isAdmin(uid: string | undefined): boolean {
  return !!uid && ADMIN_UIDS.includes(uid);
}
