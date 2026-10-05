import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { findUserApprovalProfileByEmail, resolveApprovalResult } from "./check-user"

describe("resolveApprovalResult", () => {
  it("returns missing when no approval profile exists", () => {
    assert.deepEqual(resolveApprovalResult(null), { exists: false })
  })

  it("marks approved profiles as approved", () => {
    assert.deepEqual(resolveApprovalResult({ status: "approved" }), {
      exists: true,
      approved: true,
      status: "approved",
    })
  })

  it("marks pending profiles as existing but not approved", () => {
    assert.deepEqual(resolveApprovalResult({ status: "pending" }), {
      exists: true,
      approved: false,
      status: "pending",
    })
  })
})

describe("findUserApprovalProfileByEmail", () => {
  it("looks up approval state by normalized profile email", async () => {
    const calls: string[] = []
    const result = await findUserApprovalProfileByEmail(
      async (normalizedEmail) => {
        calls.push(normalizedEmail)
        return {
          data: { status: "approved" },
          error: null,
        }
      },
      "  Member@Example.com ",
    )

    assert.deepEqual(result, { status: "approved" })
    assert.deepEqual(calls, ["member@example.com"])
  })

  it("surfaces profile lookup errors", async () => {
    await assert.rejects(
      () =>
        findUserApprovalProfileByEmail(async () => {
          return {
            data: null,
            error: { message: "profile lookup failed" },
          }
        }, "member@example.com"),
      /profile lookup failed/,
    )
  })
})
