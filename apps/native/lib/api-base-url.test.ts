import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  DEFAULT_PRODUCTION_API_BASE_URL,
  isLocalDevelopmentHostname,
  resolveApiBaseUrl,
} from "@/lib/api-base-url"

describe("api base url resolution", () => {
  it("treats localhost and private network hosts as local development hosts", () => {
    assert.equal(isLocalDevelopmentHostname("localhost"), true)
    assert.equal(isLocalDevelopmentHostname("192.168.1.20"), true)
    assert.equal(isLocalDevelopmentHostname("172.20.10.4"), true)
    assert.equal(isLocalDevelopmentHostname("api.example.com"), false)
  })

  it("falls back to the production API when no configured API base exists in dev", () => {
    assert.equal(
      resolveApiBaseUrl({
        browserBaseUrl: null,
        configuredApiBaseUrl: null,
        expoDevServerBaseUrl: "http://192.168.1.10:8081",
        isDev: true,
      }),
      DEFAULT_PRODUCTION_API_BASE_URL,
    )
  })

  it("keeps an explicit local configured API base in dev", () => {
    assert.equal(
      resolveApiBaseUrl({
        browserBaseUrl: null,
        configuredApiBaseUrl: "http://192.168.1.55:8081",
        expoDevServerBaseUrl: "http://192.168.1.10:8081",
        isDev: true,
      }),
      "http://192.168.1.55:8081",
    )
  })

  it("keeps an explicit remote API base in dev when it looks intentional", () => {
    assert.equal(
      resolveApiBaseUrl({
        browserBaseUrl: null,
        configuredApiBaseUrl: "https://api.example.com",
        expoDevServerBaseUrl: "http://192.168.1.10:8081",
        isDev: true,
      }),
      "https://api.example.com",
    )
  })

  it("falls back to production over an obviously wrong Supabase host in dev", () => {
    assert.equal(
      resolveApiBaseUrl({
        browserBaseUrl: null,
        configuredApiBaseUrl: "https://project.supabase.co",
        expoDevServerBaseUrl: "http://192.168.1.10:8081",
        isDev: true,
      }),
      DEFAULT_PRODUCTION_API_BASE_URL,
    )
  })

  it("does not override configured URLs outside dev", () => {
    assert.equal(
      resolveApiBaseUrl({
        browserBaseUrl: null,
        configuredApiBaseUrl: "http://192.168.1.55:8081",
        expoDevServerBaseUrl: "http://192.168.1.10:8081",
        isDev: false,
      }),
      "http://192.168.1.55:8081",
    )
  })
})
