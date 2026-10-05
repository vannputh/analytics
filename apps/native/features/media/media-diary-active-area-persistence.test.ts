import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createMediaDiaryAreaPersistScheduler,
  MEDIA_ACTIVE_AREA_PERSIST_DELAY_MS,
  resolvePersistedMediaDiaryArea,
  shouldPersistMediaDiaryArea,
} from "@/features/media/media-diary-active-area-persistence"

describe("media diary active area persistence", () => {
  it("normalizes the restored persisted area", () => {
    assert.equal(resolvePersistedMediaDiaryArea("backlog"), "planned")
    assert.equal(resolvePersistedMediaDiaryArea("holdAndDropped"), "paused")
    assert.equal(resolvePersistedMediaDiaryArea(null), "watched")
  })

  it("only persists after preferences have loaded and the area changed", () => {
    assert.equal(
      shouldPersistMediaDiaryArea({
        activeArea: "watched",
        activeAreaLoaded: false,
        persistedArea: "watching",
      }),
      false,
    )

    assert.equal(
      shouldPersistMediaDiaryArea({
        activeArea: "planned",
        activeAreaLoaded: true,
        persistedArea: "watched",
      }),
      true,
    )
  })

  it("coalesces rapid area switches to the final persisted value", async () => {
    const persistedAreas: string[] = []
    const cancelledHandles: number[] = []
    const scheduledCallbacks = new Map<number, () => void>()
    const scheduledDelays = new Map<number, number>()
    let nextHandle = 1

    const scheduler = createMediaDiaryAreaPersistScheduler({
      persist: async (nextArea) => {
        persistedAreas.push(nextArea)
      },
      schedule: (callback, delayMs) => {
        const handle = nextHandle++
        scheduledCallbacks.set(handle, callback)
        scheduledDelays.set(handle, delayMs)
        return handle as ReturnType<typeof setTimeout>
      },
      cancel: (handle) => {
        cancelledHandles.push(handle as number)
        scheduledCallbacks.delete(handle as number)
        scheduledDelays.delete(handle as number)
      },
    })

    scheduler.queue("watching")
    scheduler.queue("dropped")

    assert.deepEqual(cancelledHandles, [1])
    assert.equal(scheduledDelays.get(2), MEDIA_ACTIVE_AREA_PERSIST_DELAY_MS)

    scheduledCallbacks.get(2)?.()
    await Promise.resolve()

    assert.deepEqual(persistedAreas, ["dropped"])
  })
})
