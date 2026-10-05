import { describe, expect, it } from "vitest"
import { validateSQL } from "./sql-validation"

describe("validateSQL", () => {
  // The original bug: substring matching rejected any SELECT touching these
  // columns because "CREATED_AT".includes("CREATE") / "UPDATED_AT".includes("UPDATE").
  // These are the most common columns users ask about, so this silently broke the feature.
  it("accepts a SELECT that references created_at and updated_at", () => {
    const result = validateSQL("SELECT created_at, updated_at FROM media_entries")
    expect(result.valid).toBe(true)
  })

  it("accepts a plain SELECT", () => {
    expect(validateSQL("SELECT title, my_rating FROM media_entries").valid).toBe(true)
  })

  it("allows a single trailing semicolon", () => {
    expect(validateSQL("SELECT 1 FROM media_entries;").valid).toBe(true)
  })

  // Write protection: these must never reach the database, even though the RPC is
  // read-only and RLS is on — defense in depth for the AI-generated SQL path.
  it.each(["UPDATE", "DELETE", "INSERT", "DROP", "ALTER", "CREATE", "TRUNCATE"])(
    "rejects a %s statement",
    (op) => {
      const sql =
        op === "INSERT"
          ? "INSERT INTO media_entries (title) VALUES ('x')"
          : op === "UPDATE"
            ? "UPDATE media_entries SET title = 'x'"
            : op === "DELETE"
              ? "DELETE FROM media_entries"
              : `${op} TABLE media_entries`
      expect(validateSQL(sql).valid).toBe(false)
    }
  )

  it("rejects statement stacking via an embedded semicolon", () => {
    expect(validateSQL("SELECT 1; DROP TABLE media_entries").valid).toBe(false)
  })

  it("rejects line comments", () => {
    expect(validateSQL("SELECT title FROM media_entries -- comment").valid).toBe(false)
  })

  it("rejects block comments", () => {
    expect(validateSQL("SELECT title /* sneaky */ FROM media_entries").valid).toBe(false)
  })

  it("rejects queries that do not start with SELECT", () => {
    expect(validateSQL("WITH x AS (SELECT 1) SELECT * FROM x").valid).toBe(false)
  })

  // A write keyword appearing only inside a quoted string value must not match,
  // and must not falsely pass either — but a legitimate filter on a title that
  // contains the word "update" should be allowed.
  it("accepts a SELECT filtering on a title containing a keyword substring", () => {
    expect(
      validateSQL("SELECT title FROM media_entries WHERE title = 'The Created World'").valid
    ).toBe(true)
  })
})
