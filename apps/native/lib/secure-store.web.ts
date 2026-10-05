const memoryStorage = new Map<string, string>()

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const secureStore = {
  async getItem(key: string) {
    const storage = getBrowserStorage()
    return storage?.getItem(key) ?? memoryStorage.get(key) ?? null
  },
  async setItem(key: string, value: string) {
    const storage = getBrowserStorage()

    if (storage) {
      storage.setItem(key, value)
      return
    }

    memoryStorage.set(key, value)
  },
  async removeItem(key: string) {
    const storage = getBrowserStorage()

    if (storage) {
      storage.removeItem(key)
    }

    memoryStorage.delete(key)
  },
}
