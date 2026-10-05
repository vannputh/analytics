import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildPendingUserProfileInsert,
  resolveUserProfileAuthState,
} from "./user-profile-repository"

describe("user-profile-repository helpers", () => {
  it("builds a normalized pending profile insert payload", () => {
    assert.deepEqual(
      buildPendingUserProfileInsert({
        email: "  User@Example.com ",
        userId: "user-123",
      }),
      {
        email: "user@example.com",
        status: "pending",
        user_id: "user-123",
      },
    )
  })

  it("resolves approved, pending, rejected, and missing auth states", () => {
    assert.equal(resolveUserProfileAuthState(null), "missing")
    assert.equal(resolveUserProfileAuthState({ status: "approved" }), "approved")
    assert.equal(resolveUserProfileAuthState({ status: "pending" }), "pending")
    assert.equal(resolveUserProfileAuthState({ status: "rejected" }), "rejected")
  })
})
