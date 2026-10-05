/**
 * HEIC/HEIF conversion using heic-to (libheif 1.20.2).
 * Replaces heic2any which fails on many newer HEIC files (e.g. iPhone 15, iOS 18).
 */

export function isHeicFile(file: File): boolean {
  const type = file.type?.toLowerCase() ?? ""
  const name = file.name?.toLowerCase() ?? ""
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  )
}

/**
 * Convert a HEIC/HEIF file to JPEG in the browser. Returns the original file if not HEIC.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file
  }

  const { heicTo } = await import("heic-to")
  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.95,
  })

  const name = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg")
  return new File([blob], name, { type: "image/jpeg" })
}
