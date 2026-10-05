import { normalizeMediaDiaryArea } from "@/features/media/media-diary-state"
import type { MediaDiaryArea } from "@/features/media/media-types"

export const MEDIA_ACTIVE_AREA_PERSIST_DELAY_MS = 180

export function resolvePersistedMediaDiaryArea(savedArea: string | null | undefined): MediaDiaryArea {
  return normalizeMediaDiaryArea(savedArea)
}

export function shouldPersistMediaDiaryArea(params: {
  activeArea: MediaDiaryArea
  activeAreaLoaded: boolean
  persistedArea: MediaDiaryArea
}): boolean {
  return params.activeAreaLoaded && params.activeArea !== params.persistedArea
}

export function createMediaDiaryAreaPersistScheduler({
  persist,
  schedule = setTimeout,
  cancel = clearTimeout,
}: {
  persist(nextArea: MediaDiaryArea): Promise<void> | void
  schedule?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>
  cancel?: (handle: ReturnType<typeof setTimeout>) => void
}) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null
  let pendingArea: MediaDiaryArea | null = null

  return {
    cancel() {
      if (timeoutHandle !== null) {
        cancel(timeoutHandle)
        timeoutHandle = null
      }

      pendingArea = null
    },

    queue(nextArea: MediaDiaryArea, delayMs = MEDIA_ACTIVE_AREA_PERSIST_DELAY_MS) {
      pendingArea = nextArea

      if (timeoutHandle !== null) {
        cancel(timeoutHandle)
      }

      timeoutHandle = schedule(() => {
        const areaToPersist = pendingArea
        timeoutHandle = null
        pendingArea = null

        if (!areaToPersist) {
          return
        }

        void persist(areaToPersist)
      }, delayMs)
    },
  }
}
