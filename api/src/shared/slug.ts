export function slugifyName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'workspace';
}

export async function ensureUniqueSlug(
  pool: { query: (sql: string, params?: unknown[]) => Promise<{ rows: { slug: string }[] }> },
  baseSlug: string,
  excludeWorkspaceId?: string,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 1;

  for (;;) {
    const result = await pool.query(
      `SELECT slug
       FROM workspaces
       WHERE slug = $1
         AND deleted_at IS NULL
         AND ($2::uuid IS NULL OR id <> $2)
       LIMIT 1`,
      [candidate, excludeWorkspaceId ?? null],
    );
    if (!result.rows[0]) return candidate;
    suffix += 1;
    candidate = `${baseSlug.slice(0, 55)}-${suffix}`;
  }
}
