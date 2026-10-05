import type { MediaEntry } from "./database.types"

export type CreateEntryInput = Partial<Omit<MediaEntry, "id" | "created_at" | "updated_at">> & {
  title: string
}
