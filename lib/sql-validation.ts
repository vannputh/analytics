/** Forbidden (write/DDL) operations. Matched on word boundaries so that column
 *  names like `created_at`/`updated_at` are not mistaken for CREATE/UPDATE. */
const FORBIDDEN_OPERATIONS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "EXECUTE",
] as const

/**
 * Validate that an AI-generated SQL string is a single, read-only SELECT.
 * Defense in depth: the query runs through a read-only RPC under RLS, but we
 * still reject writes, statement stacking, and comments before execution.
 */
export function validateSQL(sql: string): { valid: boolean; error?: string } {
  // Allow a single trailing semicolon, then reject any further ones (statement stacking).
  const trimmed = sql.trim().replace(/;\s*$/, "")

  if (trimmed.includes(";")) {
    return { valid: false, error: "Multiple statements are not allowed." }
  }

  if (/--|\/\*/.test(trimmed)) {
    return { valid: false, error: "SQL comments are not allowed." }
  }

  const upper = trimmed.toUpperCase()

  for (const op of FORBIDDEN_OPERATIONS) {
    if (new RegExp(`\\b${op}\\b`).test(upper)) {
      return {
        valid: false,
        error: `SQL contains forbidden operation: ${op}. Only SELECT queries are allowed.`,
      }
    }
  }

  if (!upper.startsWith("SELECT")) {
    return { valid: false, error: "Query must start with SELECT." }
  }

  return { valid: true }
}
