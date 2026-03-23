// Allowed admin UID — only this user can access /admin and write posts
export const ADMIN_UID = "5amaiuG38XMkaGRoYJoDA95stfG2";

export function isAdmin(uid: string | undefined): boolean {
  return uid === ADMIN_UID;
}
