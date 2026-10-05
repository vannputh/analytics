import type { AnalyticsSupabaseClient } from "../supabase/client"

export interface PublicUploadInput {
  bucket: string
  path: string
  file: ArrayBuffer
  contentType: string
  upsert?: boolean
}

export interface MediaPosterUploadInput {
  bucket?: string
  contentType: string
  file: ArrayBuffer
  fileName?: string | null
  now?: number
  title?: string | null
  userId: string
}

export interface FoodPlaceImageUploadInput {
  bucket?: string
  contentType: string
  entryId: string
  file: ArrayBuffer
  fileName?: string | null
  now?: number
}

function sanitizeFileBaseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
}

export function inferFileExtension(contentType: string, fileName?: string | null) {
  const explicitExtension = fileName?.split(".").pop()?.trim().toLowerCase()

  if (explicitExtension) {
    return explicitExtension
  }

  switch (contentType) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/svg+xml":
      return "svg"
    default:
      return "bin"
  }
}

export function buildMediaPosterStoragePath({
  contentType,
  fileName,
  now = Date.now(),
  title,
  userId,
}: Omit<MediaPosterUploadInput, "bucket" | "file">) {
  const baseName = sanitizeFileBaseName(title || fileName || "") || `image-${now}`
  const extension = inferFileExtension(contentType, fileName)

  return `${userId}/${baseName}-${now}.${extension}`
}

export function buildFoodPlaceImageStoragePath({
  contentType,
  entryId,
  fileName,
  now = Date.now(),
}: Omit<FoodPlaceImageUploadInput, "bucket" | "file">) {
  const extension = inferFileExtension(contentType, fileName)
  return `${entryId}/place_${now}.${extension}`
}

export function createStorageRepository(client: AnalyticsSupabaseClient) {
  return {
    async uploadPublicFile({
      bucket,
      path,
      file,
      contentType,
      upsert = false,
    }: PublicUploadInput) {
      const { data, error } = await client.storage.from(bucket).upload(path, file, {
        contentType,
        upsert,
      })

      if (error) {
        throw new Error(error.message)
      }

      const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(path)

      return {
        path: data.path,
        publicUrl: publicUrl.publicUrl,
      }
    },

    async uploadMediaPoster({
      bucket = "images",
      contentType,
      file,
      fileName,
      now,
      title,
      userId,
    }: MediaPosterUploadInput) {
      const path = buildMediaPosterStoragePath({
        contentType,
        fileName,
        now,
        title,
        userId,
      })

      return this.uploadPublicFile({
        bucket,
        path,
        file,
        contentType,
      })
    },

    async uploadFoodPlaceImage({
      bucket = "food-images",
      contentType,
      entryId,
      file,
      fileName,
      now,
    }: FoodPlaceImageUploadInput) {
      const path = buildFoodPlaceImageStoragePath({
        contentType,
        entryId,
        fileName,
        now,
      })

      return this.uploadPublicFile({
        bucket,
        path,
        file,
        contentType,
      })
    },
  }
}
