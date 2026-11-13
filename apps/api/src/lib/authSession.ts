/** Resolve identity + roles from D1 on every authenticated request (JWT only proves user id + expiry). */
export async function fetchUserSession(
  db: D1Database,
  userId: number,
): Promise<{
  id: number;
  email: string;
  is_admin: boolean;
  auth_version: number;
} | null> {
  const row = await db
    .prepare("SELECT id, email, is_admin, auth_version FROM users WHERE id = ?")
    .bind(userId)
    .first<{
      id: number;
      email: string;
      is_admin: number;
      auth_version: number;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    is_admin: Number(row.is_admin) === 1,
    auth_version: row.auth_version,
  };
}
